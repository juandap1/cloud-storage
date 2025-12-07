<template>
  <q-page class="q-pa-lg">
    <!-- Breadcrumbs & Actions -->
    <div class="row items-center q-mb-xl">
      <div class="col-grow">
        <q-breadcrumbs class="text-grey-5 text-subtitle1" active-color="white">
          <template v-slot:separator>
            <q-icon size="1.2em" name="chevron_right" color="grey-7" />
          </template>
          <q-breadcrumbs-el
            label="Home"
            icon="home"
            class="cursor-pointer hover-text-primary transition-colors"
            @click="navigateTo('')"
          />
          <q-breadcrumbs-el
            v-for="(folder, index) in breadcrumbs"
            :key="index"
            :label="folder.label"
            class="cursor-pointer hover-text-primary transition-colors"
            @click="navigateTo(folder.path)"
          />
        </q-breadcrumbs>
      </div>

      <div class="row q-gutter-sm">
        <q-btn round flat icon="refresh" color="grey-5" @click="fetchFiles" class="hover-rotate">
          <q-tooltip class="bg-dark text-body2">Refresh</q-tooltip>
        </q-btn>

        <q-file
          v-model="fileToUpload"
          borderless
          dense
          style="width: 0; min-height: 0; overflow: hidden; opacity: 0"
          ref="fileInputRef"
          @update:model-value="uploadFile"
        />
        <q-btn
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Upload"
          class="q-px-lg shadow-glow"
          @click="$refs.fileInputRef.pickFiles()"
          :loading="uploading"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-center q-py-xl">
        <q-spinner-dots size="50px" color="primary" />
      </div>

      <template v-else>
        <!-- Empty State -->
        <div
          v-if="folders.length === 0 && files.length === 0"
          class="column flex-center q-py-xl text-grey-7"
        >
          <q-icon name="cloud_off" size="64px" class="q-mb-md opacity-50" />
          <div class="text-h6">Folder is empty</div>
          <div class="text-caption">Upload a file to get started</div>
        </div>

        <!-- Grid Layout -->
        <div class="row q-col-gutter-lg">
          <!-- Folders -->
          <div
            v-for="folder in folders"
            :key="folder.prefix"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              flat
              class="folder-card cursor-pointer bg-dark-card q-pa-sm"
              v-ripple
              @click="navigateTo(folder.prefix)"
            >
              <q-card-section class="row items-center no-wrap">
                <div class="icon-box bg-warning-dim q-mr-md">
                  <q-icon name="folder" color="warning" size="24px" />
                </div>
                <div class="ellipsis text-white text-weight-medium">{{ folder.name }}</div>
                <q-space />
              </q-card-section>
            </q-card>
          </div>

          <!-- Files -->
          <div v-for="file in files" :key="file.key" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <q-card
              flat
              class="file-card cursor-pointer bg-dark-card transition-transform"
              @click="openFile(file.key)"
            >
              <!-- Preview/Icon Area -->
              <div class="file-preview row flex-center bg-dark-page">
                <q-icon
                  :name="getFileIcon(file.name)"
                  color="primary"
                  size="40px"
                  class="opacity-80"
                />
              </div>

              <q-card-section>
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-white text-weight-bold ellipsis">{{ file.name }}</div>
                    <div class="text-grey-6 text-caption q-mt-xs">
                      {{ formatSize(file.size) }}
                    </div>
                  </div>
                  <q-btn flat round icon="more_vert" color="grey-6" size="sm" @click.stop />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>
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
    const fileInputRef = ref(null)

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

        folders.value = (data.commonPrefixes || data.CommonPrefixes || []).map((p) => ({
          prefix: p.prefix || p.Prefix,
          name: (p.prefix || p.Prefix).replace(currentPath.value, '').replace('/', ''),
        }))

        files.value = (data.contents || data.Contents || [])
          .map((f) => ({
            key: f.key || f.Key,
            name: (f.key || f.Key).replace(currentPath.value, ''),
            size: f.size || f.Size,
            lastModified: f.lastModified || f.LastModified,
          }))
          .filter((f) => f.name !== '')
      } catch (error) {
        console.error(error)
        $q.notify({
          type: 'negative',
          message: 'Failed to retrieve files',
          position: 'top',
        })
      } finally {
        loading.value = false
      }
    }

    const uploadFile = async (file) => {
      if (!file) return

      uploading.value = true
      fileToUpload.value = file
      const formData = new FormData()
      formData.append('file', file)

      try {
        await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        $q.notify({
          type: 'positive',
          message: 'Upload successful',
          position: 'top',
        })
        fileToUpload.value = null
        fetchFiles()
      } catch (error) {
        console.error(error)
        $q.notify({
          type: 'negative',
          message: 'Upload failed',
          position: 'top',
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
      const url = `http://localhost:8000/object/${key}`
      window.open(url, '_blank')
    }

    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getFileIcon = (filename) => {
      const ext = filename.split('.').pop().toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
      if (['pdf'].includes(ext)) return 'picture_as_pdf'
      if (['txt', 'md', 'doc', 'docx'].includes(ext)) return 'description'
      if (['mp4', 'mov', 'avi'].includes(ext)) return 'movie'
      if (['mp3', 'wav'].includes(ext)) return 'audiotrack'
      if (['zip', 'rar', '7z'].includes(ext)) return 'folder_zip'
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
      fileInputRef,
      fetchFiles,
      uploadFile,
      navigateTo,
      openFile,
      formatSize,
      getFileIcon,
    }
  },
})
</script>

<style scoped lang="scss">
.bg-dark-card {
  background: #1e1e1e; /* Slightly lighter than page dark */
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.folder-card:hover,
.file-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  background: #252525;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-warning-dim {
  background: rgba(253, 203, 110, 0.15);
}

.file-preview {
  height: 120px;
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.hover-text-primary:hover {
  color: var(--q-primary) !important;
}

.transition-colors {
  transition: color 0.3s ease;
}

.hover-rotate:hover .q-icon {
  transform: rotate(180deg);
  transition: transform 0.5s ease;
}

.shadow-glow {
  box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(108, 92, 231, 0.6);
  }
}
</style>
