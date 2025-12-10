import { serve, S3Client, S3ListObjectsResponse } from "bun";
import { createDAVClient } from "tsdav";
const ical = require("node-ical");

const PORT = 6989;
const client = new S3Client({
  accessKeyId: process.env.MINIO_ROOT_USER,
  secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  bucket: "bran-bucket",
  endpoint: `http://${process.env.MINIO_ENDPOINT}`,
});

const caldavClient = await createDAVClient({
  serverUrl: process.env.CALDAV_URL || "http://173.73.175.116:5232",
  credentials: {
    username: process.env.CALDAV_USER || "admin",
    password: process.env.CALDAV_PASS || "",
  },
  authMethod: "Basic",
  defaultAccountType: "caldav",
});
const calendars = await caldavClient.fetchCalendars();

const weather_api = process.env.WEATHER_API_KEY;
const news_api = process.env.NEWS_API_KEY;
const logo_api = process.env.LOGO_API_KEY;

function postProcessResponse(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

// function createIcalEvent(
//   summary: string,
//   start: Date,
//   end: Date,
//   uid: string
// ): string {
//   // CalDAV requires dates to be in UTC (Z) and compressed format (YYYYMMDDTHHMMSS)
//   const formatTime = (date: Date) =>
//     date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

//   return `BEGIN:VCALENDAR
// VERSION:2.0
// PRODID:-//TSDAV Insert Event//EN
// BEGIN:VEVENT
// UID:${uid}
// DTSTAMP:${formatTime(new Date())}
// DTSTART:${formatTime(start)}
// DTEND:${formatTime(end)}
// SUMMARY:${summary}
// END:VEVENT
// END:VCALENDAR`;
// }

async function getBucketTotalSize(
  client: S3Client,
  bucket: string,
  prefix: string = ""
): Promise<number> {
  let totalSize = 0;
  let nextContinuationToken: string | undefined = undefined;

  do {
    // 1. List objects, handling pagination with continuationToken
    const response: S3ListObjectsResponse = await client.list({
      bucket: bucket,
      prefix: prefix, // Use prefix to simulate a "folder" or list the whole bucket
      maxKeys: 1000, // Maximum per request
      continuationToken: nextContinuationToken,
    });

    // 2. Sum the size of the objects in the current page
    if (response.contents) {
      for (const object of response.contents) {
        // The 'size' is the object size in bytes
        totalSize += object.size || 0;
      }
    }

    // 3. Prepare for the next iteration if the list is truncated (more objects exist)
    nextContinuationToken = response.nextContinuationToken;
  } while (nextContinuationToken);

  return totalSize;
}

serve({
  port: PORT,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    const method = req.method;

    if (path === "/") {
      return postProcessResponse(new Response("Hello World"));
    }

    if (path === "/upload" && method === "POST") {
      const formData = await req.formData();
      const files = formData.getAll("file");
      const uploadedFiles = files.filter((item) => item instanceof File);
      const uploadPromises = uploadedFiles.map((file) => {
        const uuid = crypto.randomUUID();
        const parts = file.name.split(".");
        const extension = parts.length > 1 ? `.${parts.pop()}` : "";
        const fileName = `${uuid}${extension}`;
        const destination = `pics/${fileName}`;
        return client.write(destination, file);
      });
      const results = await Promise.all(uploadPromises);
      return postProcessResponse(
        new Response(
          JSON.stringify({
            message: `File uploads finished.`,
            results: results,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }

    if (path === "/bucket/size" && method === "GET") {
      const totalSize = await getBucketTotalSize(client, "bran-bucket");
      return postProcessResponse(
        new Response(JSON.stringify({ totalSize }), { status: 200 })
      );
    }

    if (path === "/list-objects" && method === "GET") {
      const url = new URL(req.url);
      const prefix = url.searchParams.get("prefix") || "";
      const objects = await client.list({
        prefix,
        delimiter: "/",
      });
      return postProcessResponse(
        new Response(JSON.stringify(objects), { status: 200 })
      );
    }

    if (path.startsWith("/object/") && method === "GET") {
      const key = path.substring("/object/".length);
      console.log(key);
      if (!key) {
        return postProcessResponse(
          new Response("No key provided.", { status: 400 })
        );
      }
      const object = client.file(key);
      console.log(object);
      console.log(object.size);
      if (!object || object.size === 0) {
        return postProcessResponse(
          new Response("Object not found.", { status: 404 })
        );
      }
      return postProcessResponse(new Response(object));
    }

    if (path.startsWith("/object/") && method === "DELETE") {
      const key = path.substring("/object/".length);
      await client.delete(key);
      return postProcessResponse(
        new Response("Object deleted successfully", { status: 200 })
      );
    }

    // HOME HUB
    if (path === "/logo" && method === "GET") {
      const company = new URL(req.url).searchParams.get("company");
      const domain = new URL(req.url).searchParams.get("domain");

      const s3Logo = client.file(`logos/${company}.png`);
      let s3Exists = await s3Logo.exists();
      if (s3Exists) return postProcessResponse(new Response(s3Logo));

      const response = await fetch(
        `https://img.logo.dev/${domain}?token=${logo_api}`
      );
      // const contentType = response.headers.get("Content-Type");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await client.write(`logos/${company}.png`, buffer);
      return postProcessResponse(new Response(buffer));
    }

    if (path === "/weather" && method === "GET") {
      const response = await fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=${weather_api}&q=20854&days=4`
      );

      const data = await response.json();

      return postProcessResponse(new Response(JSON.stringify(data)));
    }

    if (path === "/news" && method === "GET") {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&apiKey=${news_api}`
      );
      const data = await response.json();
      return postProcessResponse(new Response(JSON.stringify(data)));
    }

    if (path === "/calendar" && method === "GET") {
      const now = new Date();
      const start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const oneYearFromNow = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000
      );
      let parsedEvents = [];
      for (const calendar of calendars) {
        const calendarObjects = await caldavClient.fetchCalendarObjects({
          calendar: calendar,
          timeRange: {
            start: start.toISOString(),
            end: oneYearFromNow.toISOString(),
          },
        });
        calendarObjects.forEach((event) => {
          let parsed = Object.values(ical.parseICS(event.data)).find(
            (value: any) => value.type === "VEVENT"
          );
          parsedEvents.push({
            ...parsed,
            calendar: calendar.displayName,
            calendarColor: calendar.calendarColor,
          });
        });
      }
      return postProcessResponse(new Response(JSON.stringify(parsedEvents)));
    }

    // 404s
    return postProcessResponse(new Response("Page not found", { status: 404 }));
  },
});

console.log(`Listening on http://localhost:${PORT} ...`);
