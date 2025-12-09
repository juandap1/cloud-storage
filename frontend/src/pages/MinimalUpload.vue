<template>
  <q-page class="page-wrapper bg-dark-page">
    <div class="upload-wrapper">
      <q-icon class="upload-icon" name="mdi-cloud-upload-outline" size="50px" />
      <h6>Select Photos to Upload</h6>
      <p>Drag and drop files here or click to upload</p>
      <input class="upload-input" type="file" multiple @change="processFiles" accept="image/*" />
    </div>
    <button v-if="files.length > 0" class="upload-button" @click="uploadFiles">
      Upload {{ files.length }} Image(s)
    </button>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="files.length > 0" class="q-pa-lg">
      <h6>Preview Files</h6>
      <div class="preview-container">
        <div class="preview-wrapper" v-for="(preview, index) in previews" :key="index">
          <img :src="preview" />
          <div>
            <button class="remove-button" @click="removeFile(index)">Remove</button>
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
      previews: null,
      error: null,
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
      try {
        this.$q.loading.show({
          spinner: QSpinnerDots,
          spinnerColor: 'primary',
          message: 'Uploading Files...',
          messageColor: 'white',
        })
        const formData = new FormData()
        this.files.forEach((file) => {
          formData.append('file', file)
        })
        let res = await api.post('/upload', formData)
        if (res.status === 200) {
          this.$q.notify({
            type: 'positive',
            message: 'Files uploaded successfully',
          })
        }
      } catch (e) {
        this.error = e.message
      }
      this.files = []
      this.previews = null
      this.$q.loading.hide()
    },
  },
  mounted() {},
})
</script>

<style scoped>
.page-wrapper {
  padding: 50px 0px;
  height: calc(100vh - 100px);
  overflow-y: auto;
}

.upload-wrapper {
  margin: auto;
  padding: 100px 0px;
  position: relative;
  border-radius: 10px;
  border: 2px dashed rgb(108, 92, 231);
  max-width: 85%;
  text-align: center;
  line-height: 1;
  cursor: pointer;
}

.upload-input {
  opacity: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
  top: 0;
  left: 0;
}

.upload-icon {
  background-color: rgba(108, 92, 231, 0.3);
  border-radius: 50%;
  padding: 20px;
}

h6 {
  margin: 10px 0;
  font-weight: bold;
}

p {
  margin: 0;
  font-weight: bold;
  color: #aaa;
}

.upload-button {
  margin: 20px auto;
  display: block;
  padding: 10px 50px;
  border-radius: 50px;
  background-color: rgba(108, 92, 231);
  color: #fff;
  border: none;
  outline: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-button:hover {
  background-color: rgba(108, 92, 231, 0.8);
  scale: 1.03;
}

.preview-container {
  display: flex;
  flex-wrap: wrap;
}

.preview-wrapper {
  margin: 10px;
  text-align: center;
}

.preview-wrapper img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  margin-bottom: 5px;
}

.remove-button {
  background-color: rgb(255, 72, 72);
  color: #fff;
  border: none;
  outline: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 5px 10px;
  border-radius: 5px;
}

.error-message {
  color: red;
  margin: 10px 0;
  background-color: rgba(255, 72, 72, 0.1);
  padding: 10px;
  border-radius: 5px;
}
</style>
