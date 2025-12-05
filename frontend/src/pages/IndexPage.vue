<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row items-center q-mb-md">
      <q-breadcrumbs class="text-grey-8 text-h6" active-color="primary">
        <template v-slot:separator>
          <q-icon size="1.5em" name="chevron_right" color="primary" />
        </template>
        <q-breadcrumbs-el label="Home" icon="home" class="cursor-pointer" @click="navigateTo('')" />
        <q-breadcrumbs-el
          v-for="(folder, index) in breadcrumbs"
          :key="index"
          :label="folder.label"
          class="cursor-pointer"
          @click="navigateTo(folder.path)"
        />
      </q-breadcrumbs>
      <q-space />
      <q-btn round flat icon="refresh" color="primary" @click="fetchFiles" />
    </div>

    <div class="row q-col-gutter-md">
      <!-- Upload Section -->
      <div class="col-12">
        <q-card flat bordered class="upload-card">
          <q-card-section class="row items-center no-wrap">
            <q-file v-model="fileToUpload" label="Upload File" outlined dense class="col">
              <template v-slot:prepend>
                <q-icon name="cloud_upload" />
              </template>
            </q-file>
            <q-btn
              label="Upload"
              color="primary"
              class="q-ml-sm"
              :disable="!fileToUpload"
              :loading="uploading"
              @click="uploadFile"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Folders and Files List -->
      <div class="col-12">
        <q-card flat bordered>
          <q-list separator>
            <!-- Loading State -->
            <div v-if="loading" class="q-pa-md text-center">
              <q-spinner size="40px" color="primary" />
            </div>

            <template v-else>
              <!-- Empty State -->
              <q-item v-if="folders.length === 0 && files.length === 0">
                <q-item-section avatar>
                  <q-icon name="folder_open" color="grey-5" size="md" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-grey-6">Folder is empty</q-item-label>
                </q-item-section>
              </q-item>

              <!-- Folders -->
              <q-item
                v-for="folder in folders"
                :key="folder.prefix"
                clickable
                v-ripple
                @click="navigateTo(folder.prefix)"
              >
                <q-item-section avatar>
                  <q-icon name="folder" color="amber-7" size="md" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ folder.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" color="grey" />
                </q-item-section>
              </q-item>

              <!-- Files -->
              <q-item
                v-for="file in files"
                :key="file.key"
                clickable
                v-ripple
                @click="openFile(file.key)"
              >
                <q-item-section avatar>
                  <q-icon :name="getFileIcon(file.name)" color="primary" size="md" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ file.name }}</q-item-label>
                  <q-item-label caption>
                    {{ formatSize(file.size) }} • {{ formatDate(file.lastModified) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    icon="download"
                    color="grey-7"
                    @click.stop="openFile(file.key)"
                  />
                </q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'IndexPage',
  setup() {
    const $q = useQuasar()
    const currentPath = ref('')
    const folders = ref([])
    const files = ref([])
    const loading = ref(false)
    const uploading = ref(false)
    const fileToUpload = ref(null)

    const breadcrumbs = computed(() => {
      if (!currentPath.value) return []
      const parts = currentPath.value.replace(/\/$/, '').split('/')
      let pathAccumulator = ''
      return parts.map((part) => {
        pathAccumulator += part + '/'
        return {
          label: part,
          path: pathAccumulator,
        }
      })
    })

    const fetchFiles = async () => {
      loading.value = true
      try {
        const response = await api.get('/list-objects', {
          params: { prefix: currentPath.value },
        })

        const data = response.data

        // Parse Folders
        folders.value = (data.CommonPrefixes || []).map((p) => ({
          prefix: p.Prefix,
          name: p.Prefix.replace(currentPath.value, '').replace('/', ''),
        }))

        // Parse Files
        files.value = (data.Contents || [])
          .map((f) => ({
            key: f.Key,
            name: f.Key.replace(currentPath.value, ''),
            size: f.Size,
            lastModified: f.LastModified,
          }))
          .filter((f) => f.name !== '') // Filter out the current directory marker if present
      } catch (error) {
        console.error(error)
        $q.notify({
          color: 'negative',
          message: 'Failed to load files',
          icon: 'error',
        })
      } finally {
        loading.value = false
      }
    }

    const uploadFile = async () => {
      if (!fileToUpload.value) return

      uploading.value = true
      const formData = new FormData()
      formData.append('file', fileToUpload.value)
      // Note: Backend currently uploads to 'pics/' hardcoded or similar in upload_file?
      // Checking backend code: upload_file uses Key=f"pics/{file.filename}".
      // It IGNORES current path. We might want to fix backend to accept path,
      // but for now we won't break it.
      // Actually, let's just upload. The backend forces "pics/" prefix in step 253.

      try {
        await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        $q.notify({
          color: 'positive',
          message: 'File uploaded successfully',
          icon: 'check',
        })
        fileToUpload.value = null
        // If we are in root or pics folder, refresh.
        fetchFiles()
      } catch (error) {
        console.error(error)
        $q.notify({
          color: 'negative',
          message: 'Upload failed',
          icon: 'error',
        })
      } finally {
        uploading.value = false
      }
    }

    const navigateTo = (path) => {
      currentPath.value = path
      fetchFiles()
    }

    const openFile = (key) => {
      // Direct download/view link
      const url = `http://localhost:8000/object/${key}`
      window.open(url, '_blank')
    }

    const formatSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString()
    }

    const getFileIcon = (filename) => {
      const ext = filename.split('.').pop().toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image'
      if (['pdf'].includes(ext)) return 'picture_as_pdf'
      if (['txt', 'md'].includes(ext)) return 'description'
      if (['mp4', 'mov'].includes(ext)) return 'movie'
      return 'insert_drive_file'
    }

    onMounted(() => {
      fetchFiles()
    })

    return {
      currentPath,
      folders,
      files,
      breadcrumbs,
      loading,
      uploading,
      fileToUpload,
      fetchFiles,
      uploadFile,
      navigateTo,
      openFile,
      formatSize,
      formatDate,
      getFileIcon,
    }
  },
})
</script>

<style scoped>
.upload-card {
  border-radius: 8px;
}
</style>
