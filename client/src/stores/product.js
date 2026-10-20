import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProducts, deleteProduct as removeProduct } from '../api/product'

export const useProductStore = defineStore('product', () => {
  const list = ref([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetchProducts({ page: 1, size: 50 })
      list.value = res.data.list
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    await removeProduct(id)
    list.value = list.value.filter((p) => p._id !== id)
  }

  return { list, loading, load, remove }
})
