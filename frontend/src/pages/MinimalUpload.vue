<template>
  <q-page class="page-wrapper bg-dark-page">
    <q-linear-progress
      v-if="uploading"
      indeterminate
      color="primary"
      class="q-mt-sm fixed-top"
      style="z-index: 2000"
    />

    <div class="header-section q-pa-lg text-center">
      <h4 class="text-white text-weight-bold q-mb-xs">Cloud Storage</h4>
      <p class="text-grey-5">Upload your memories with ease</p>
    </div>

    <div class="upload-container">
      <div class="upload-card shadow-10">
        <div class="upload-zone" :class="{ 'upload-zone--active': files.length > 0 }">
          <q-icon class="upload-icon" name="mdi-cloud-upload" size="64px" />
          <h6 class="text-white">Select Photos</h6>
          <p>Drag and drop or click to browse</p>
          <input
            class="upload-input"
            type="file"
            multiple
            @change="processFiles"
            accept="image/*"
            :disabled="uploading"
          />
        </div>

        <div v-if="files.length > 0" class="actions-row q-mt-lg flex justify-center">
          <button class="upload-button" @click="uploadFiles" :disabled="uploading">
            <q-spinner-dots v-if="uploading" class="q-mr-sm" />
            {{ uploading ? 'Uploading...' : `Upload ${files.length} Image(s)` }}
          </button>
        </div>
      </div>

      <div v-if="error" class="error-message q-mt-md">{{ error }}</div>

      <div v-if="files.length > 0" class="preview-section q-mt-xl">
        <div class="flex items-center justify-between q-mb-lg">
          <h5 class="text-white q-ma-none">Review Queue</h5>
          <span class="text-grey-5">{{ files.length }} files selected</span>
        </div>

        <div class="preview-grid">
          <div class="preview-card" v-for="(preview, index) in previews" :key="index">
            <div class="image-wrapper">
              <img :src="preview" />
              <q-btn
                round
                dense
                color="red"
                icon="mdi-close"
                class="remove-device-btn"
                @click="removeFile(index)"
                :disabled="uploading"
              />
            </div>
            <div class="file-info text-center">
              <span class="file-name text-white">{{ files[index]?.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { api } from 'src/boot/axios'
import { defineComponent } from 'vue'
import { QSpinnerDots } from 'quasar'

export default defineComponent({
  name: 'MinimalUpload',
  props: {},
  data() {
    return {
      files: [],
      previews: [],
      error: null,
      uploading: false,
    }
  },
  methods: {
    processFiles(e) {
      this.error = null
      try {
        this.files = Array.from(e.target.files)
        this.previews = this.files.map((file) => URL.createObjectURL(file))
      } catch (e) {
        this.error = e.message
      }
    },
    removeFile(index) {
      this.files.splice(index, 1)
      this.previews.splice(index, 1)
    },
    async uploadFiles() {
      if (this.files.length === 0) return

      this.uploading = true
      this.error = null
      const totalFiles = this.files.length
      let successfulUploads = 0

      this.$q.loading.show({
        spinner: QSpinnerDots,
        spinnerColor: 'primary',
        message: `Preparing to upload ${totalFiles} file(s)...`,
        messageColor: 'white',
      })

      try {
        for (let i = 0; i < totalFiles; i++) {
          const file = this.files[i]
          const formData = new FormData()
          formData.append('file', file)

          const updateProgress = (percent) => {
            this.$q.loading.show({
              message: `Uploading file ${i + 1}/${totalFiles}<br/><span class="text-caption text-grey-4">${file.name}</span><br/><b class="text-h6">${percent}%</b>`,
              html: true,
            })
          }

          updateProgress(0)

          try {
            const res = await api.post('/upload', formData, {
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total,
                )
                updateProgress(percentCompleted)
              },
            })

            if (res.status === 200 || res.status === 202) {
              successfulUploads++
            }
          } catch (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError)
            this.error = `Failed to upload ${file.name}: ${uploadError.message}`
            // We can choose to break or continue. Continuing seems better but let's show notification.
            this.$q.notify({
              type: 'negative',
              message: `Error uploading ${file.name}`,
              caption: uploadError.message,
            })
          }
        }

        if (successfulUploads === totalFiles) {
          this.$q.notify({
            type: 'positive',
            message: 'All files uploaded successfully',
            caption: 'Processing in progress on server',
          })
          this.files = []
          this.previews = []
        } else if (successfulUploads > 0) {
          this.$q.notify({
            type: 'warning',
            message: `Only ${successfulUploads} of ${totalFiles} files uploaded`,
          })
          // Remove only successful ones? For simplicity let's keep remaining
          this.files = this.files.slice(successfulUploads)
          this.previews = this.previews.slice(successfulUploads)
        }
      } catch (globalError) {
        this.error = globalError.message
      } finally {
        this.$q.loading.hide()
        this.uploading = false
      }
    },
  },
  mounted() {},
})
</script>

<style scoped>
.page-wrapper {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  padding-bottom: 50px;
}

.upload-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.upload-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.upload-zone {
  border: 2px dashed rgba(108, 92, 231, 0.5);
  border-radius: 20px;
  padding: 60px 20px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  background: rgba(108, 92, 231, 0.02);
}

.upload-zone:hover,
.upload-zone--active {
  border-color: #6c5ce7;
  background: rgba(108, 92, 231, 0.08);
}

.upload-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.upload-button {
  background: linear-gradient(135deg, #6c5ce7 0%, #8e44ad 100%);
  color: white;
  border: none;
  padding: 16px 48px;
  border-radius: 100px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 10px 20px rgba(108, 92, 231, 0.3);
}

.upload-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(108, 92, 231, 0.4);
}

.upload-button:active:not(:disabled) {
  transform: translateY(0);
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.preview-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease;
}

.preview-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-device-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.remove-device-btn .q-icon {
  font-size: 20px;
}

.file-info {
  padding: 12px;
}

.file-name {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.error-message {
  color: #ff7675;
  background: rgba(214, 48, 49, 0.1);
  padding: 15px;
  border-radius: 12px;
  border: 1px solid rgba(214, 48, 49, 0.2);
  text-align: center;
}
</style>
