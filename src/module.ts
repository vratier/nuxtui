import { defineNuxtModule, installModule, addComponentsDir, addTemplate, addPlugin, createResolver } from '@nuxt/kit'
import { defu } from 'defu'
import colors from 'tailwindcss/colors.js'
import type { Config } from 'tailwindcss'
import { name, version } from '../package.json'
import { colorsAsRegex, excludeColors } from './runtime/utils/colors'
import defaultPreset from './runtime/presets/default'

// @ts-ignore
delete colors.lightBlue
// @ts-ignore
delete colors.warmGray
// @ts-ignore
delete colors.trueGray
// @ts-ignore
delete colors.coolGray
// @ts-ignore
delete colors.blueGray

interface ColorsOptions {
  /**
   * @default 'indigo'
   */
  primary?: string

  /**
   * @default 'gray'
   */
  gray?: string
}

export interface ModuleOptions {
  preset?: object

  /**
   * @default 'u'
   */
  prefix?: string

  colors?: ColorsOptions

  tailwindcss?: Partial<Config>
}

const defaults = {
  preset: {},
  prefix: 'u',
  colors: {
    primary: 'indigo',
    gray: 'gray'
  },
  tailwindcss: {
    theme: {}
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'ui',
    compatibility: {
      nuxt: '^3.0.0',
      bridge: true
    }
  },
  defaults,
  async setup (options, nuxt) {
    const { preset = {}, prefix, colors: { primary = 'indigo', gray = 'gray' } = {}, tailwindcss: { theme = {} } = {} } = options

    const { resolve } = createResolver(import.meta.url)

    // Transpile runtime
    const runtimeDir = resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('@popperjs/core', '@headlessui/vue', '@iconify/vue')

    // @ts-ignore
    nuxt.hook('tailwindcss:config', function (tailwindConfig: TailwindConfig) {
      const globalColors = {
        ...(tailwindConfig.theme.colors || colors),
        ...tailwindConfig.theme.extend?.colors
      }

      // @ts-ignore
      tailwindConfig.theme.extend.colors = tailwindConfig.theme.extend.colors || {}
      // @ts-ignore
      globalColors.primary = tailwindConfig.theme.extend.colors.primary = globalColors[primary] || colors[primary]
      // @ts-ignore
      globalColors.gray = tailwindConfig.theme.extend.colors.gray = globalColors[gray] || colors[gray]

      const variantColors = excludeColors(globalColors)
      const safeColorsAsRegex = colorsAsRegex(variantColors)

      tailwindConfig.safelist = tailwindConfig.safelist || []
      tailwindConfig.safelist.push(...[{
        pattern: new RegExp(`bg-(${safeColorsAsRegex})-400`)
      },
      {
        pattern: new RegExp(`bg-(${safeColorsAsRegex})-(100|600|700)`),
        variants: ['hover', 'disabled', 'dark']
      },
      {
        pattern: new RegExp(`text-(${safeColorsAsRegex})-(100|800)`),
        variants: ['dark']
      },
      {
        pattern: new RegExp(`ring-(${safeColorsAsRegex})-(500)`),
        variants: ['focus']
      }])

      const ui: object = defu(preset, defaultPreset(variantColors))

      addTemplate({
        filename: 'ui.mjs',
        getContents: () => `export default ${JSON.stringify(ui)}`
      })
    })

    await installModule('@nuxtjs/color-mode', { classSuffix: '' })
    await installModule('@nuxtjs/tailwindcss', {
      viewer: false,
      config: {
        darkMode: 'class',
        theme,
        plugins: [
          require('@tailwindcss/forms'),
          require('@tailwindcss/line-clamp'),
          require('@tailwindcss/aspect-ratio'),
          require('@tailwindcss/typography')
        ],
        content: [
          resolve(runtimeDir, 'components/**/*.{vue,js,ts}'),
          resolve(runtimeDir, 'presets/*.{mjs,js,ts}')
        ],
        safelist: [
          'dark',
          {
            pattern: /rounded-(sm|md|lg|xl|2xl|3xl)/,
            variants: ['sm']
          }
        ]
      },
      cssPath: resolve(runtimeDir, 'tailwind.css')
    })

    addPlugin(resolve(runtimeDir, 'plugins', 'toast.client'))
    addPlugin(resolve(runtimeDir, 'plugins', 'clipboard.client'))

    addComponentsDir({
      path: resolve(runtimeDir, 'components', 'elements'),
      prefix,
      watch: false
    })
    addComponentsDir({
      path: resolve(runtimeDir, 'components', 'feedback'),
      prefix,
      watch: false
    })
    addComponentsDir({
      path: resolve(runtimeDir, 'components', 'forms'),
      prefix,
      watch: false
    })
    addComponentsDir({
      path: resolve(runtimeDir, 'components', 'layout'),
      prefix,
      watch: false
    })
    addComponentsDir({
      path: resolve(runtimeDir, 'components', 'navigation'),
      prefix,
      watch: false
    })
    addComponentsDir({
      path: resolve(runtimeDir, 'components', 'overlays'),
      prefix,
      watch: false
    })

    // Add composables
    nuxt.hook('autoImports:dirs', (dirs) => {
      dirs.push(resolve(runtimeDir, 'composables'))
    })
  }
})