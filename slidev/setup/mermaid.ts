import { defineMermaidSetup } from '@slidev/types'

// Thème Mermaid aligné sur la DA MontoMaster (dark + accent cyan #7bd0ff).
// On part du thème `base` et on surcharge les variables.
export default defineMermaidSetup(() => {
  return {
    theme: 'base',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    themeVariables: {
      // --- Couleurs générales ---
      darkMode: true,
      background: 'transparent',
      primaryColor: '#18181b', // surface container
      primaryTextColor: '#fafafa', // on-surface
      primaryBorderColor: '#7bd0ff', // accent cyan
      secondaryColor: '#0e3a4d', // primary container
      secondaryTextColor: '#e4e4e7',
      secondaryBorderColor: '#47c4ff',
      tertiaryColor: '#242428', // surface variant
      tertiaryTextColor: '#fafafa',
      tertiaryBorderColor: '#3f3f46',
      lineColor: '#71717a', // outline
      textColor: '#fafafa',
      mainBkg: '#18181b',
      nodeBorder: '#7bd0ff',
      clusterBkg: '#0b0b0c',
      clusterBorder: '#3f3f46',
      titleColor: '#7bd0ff',
      edgeLabelBackground: '#18181b',

      // --- Notes ---
      noteBkgColor: '#0e3a4d',
      noteTextColor: '#e4e4e7',
      noteBorderColor: '#47c4ff',

      // --- Sequence diagram ---
      actorBkg: '#18181b',
      actorBorder: '#7bd0ff',
      actorTextColor: '#fafafa',
      actorLineColor: '#3f3f46',
      signalColor: '#a1a1aa',
      signalTextColor: '#fafafa',
      labelBoxBkgColor: '#242428',
      labelBoxBorderColor: '#7bd0ff',
      labelTextColor: '#fafafa',
      loopTextColor: '#fafafa',
      activationBkgColor: '#0e3a4d',
      activationBorderColor: '#7bd0ff',

      // --- Class / ER diagrams ---
      classText: '#fafafa',
      attributeBackgroundColorOdd: '#18181b',
      attributeBackgroundColorEven: '#1f1f23',

      // --- State diagram ---
      labelColor: '#fafafa',

      // --- Statuts (réutilise la palette catégories MontoMaster) ---
      errorBkgColor: '#5c1a1a',
      errorTextColor: '#f87171',
    },
  }
})
