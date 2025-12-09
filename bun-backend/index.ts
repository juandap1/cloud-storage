import { serve, S3Client } from "bun";

const PORT = 6989;
const client = new S3Client({
  accessKeyId: process.env.MINIO_ROOT_USER,
  secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  bucket: "bran-bucket",
  endpoint: `http://${process.env.MINIO_ENDPOINT}`,
});

function postProcessResponse(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
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

    // 404s
    return postProcessResponse(new Response("Page not found", { status: 404 }));
  },
});

console.log(`Listening on http://localhost:${PORT} ...`);
