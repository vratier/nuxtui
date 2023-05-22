<script setup>
import JsonEditorVue from 'json-editor-vue'

const props = defineProps({
  preset: {
    type: String,
    required: true
  }
})
const appConfig = useAppConfig()
const uiConfig = computed({
  get () {
    return appConfig.ui[props.preset]
  },
  set(value) {
    try {
      value = JSON.parse(value)
      updateAppConfig({
        ui: {
          [props.preset]: value
        }
      })
    } catch (e) {
      // @ts-ignore
    }
  }
})
</script>

<template>
  <JsonEditorVue
    v-model="uiConfig"
    :class="[$colorMode.value === 'dark' ? 'jse-theme-dark' : 'light']"
    class="json-editor-vue h-full of-auto text-sm outline-none"
    v-bind="$attrs"
    mode="text"
    :main-menu-bar="false"
    :navigation-bar="false"
    :indentation="2"
    :tab-size="2"
  />
</template>
