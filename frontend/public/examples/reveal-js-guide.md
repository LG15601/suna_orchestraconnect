# Guide d'utilisation de Reveal.js avec SUNA Orchestra

Ce guide explique comment créer et afficher des présentations Reveal.js avec l'agent SUNA Orchestra.

## Qu'est-ce que Reveal.js ?

Reveal.js est un framework open-source pour créer des présentations HTML interactives. Il offre de nombreuses fonctionnalités :

- Navigation intuitive (clavier, souris, tactile)
- Thèmes personnalisables
- Transitions entre diapositives
- Support du Markdown
- Mode présentateur avec notes
- Et bien plus encore...

## Comment créer une présentation Reveal.js

### Méthode 1 : Utiliser les utilitaires JavaScript

L'agent peut générer des présentations Reveal.js en utilisant les fonctions utilitaires fournies :

```javascript
// Importer les utilitaires
import { createRevealPresentation } from "@/lib/utils/reveal-utils";

// Définir le titre et les diapositives
const title = "Ma présentation";
const slides = [
  {
    title: "Introduction",
    content: "<p>Ceci est la première diapositive</p><ul><li>Point 1</li><li>Point 2</li></ul>"
  },
  {
    title: "Deuxième diapositive",
    content: "<p>Ceci est la deuxième diapositive</p>",
    background: "#ff5500"
  },
  {
    content: "## Diapositive en Markdown\n\n- Point 1\n- Point 2\n\n```javascript\nconst hello = 'world';\n```"
  }
];

// Générer le HTML de la présentation
const html = createRevealPresentation(title, slides, { 
  theme: 'sky',
  transition: 'fade'
});

// Enregistrer le HTML dans un fichier
// Utiliser l'outil de création de fichier de l'agent
```

### Méthode 2 : Créer une présentation à partir de Markdown

Pour une approche plus simple, vous pouvez convertir du contenu Markdown en présentation :

```javascript
import { createRevealFromMarkdown } from "@/lib/utils/reveal-utils";

const title = "Ma présentation Markdown";
const markdown = `
# Introduction

Ceci est la première diapositive

- Point 1
- Point 2

# Deuxième diapositive

Ceci est la deuxième diapositive

\`\`\`javascript
const hello = 'world';
\`\`\`
`;

const html = createRevealFromMarkdown(title, markdown, { theme: 'moon' });
```

### Méthode 3 : Écrire directement le HTML

Vous pouvez également créer manuellement le HTML d'une présentation Reveal.js :

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ma présentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/black.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section>
        <h1>Ma présentation</h1>
      </section>
      <section>
        <h2>Diapositive 1</h2>
        <p>Contenu de la diapositive 1</p>
      </section>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
  <script>
    Reveal.initialize({ controls: true, progress: true });
  </script>
</body>
</html>
```

## Exemple de prompt pour l'agent

Voici un exemple de prompt que vous pouvez utiliser pour demander à l'agent de créer une présentation :

```
Crée une présentation Reveal.js sur [SUJET] avec les sections suivantes :
1. Introduction
2. Points clés
3. Exemples
4. Conclusion

Utilise le thème "sky" et des transitions "fade".
```

## Affichage des présentations

Une fois la présentation créée et enregistrée dans un fichier HTML, elle sera automatiquement détectée comme une présentation Reveal.js et affichée avec le composant RevealRenderer, qui offre des contrôles spécifiques pour les présentations.

## Options de personnalisation

Reveal.js offre de nombreuses options de personnalisation :

### Thèmes disponibles
- black (défaut)
- white
- league
- beige
- sky
- night
- serif
- simple
- solarized

### Transitions
- none
- fade
- slide (défaut)
- convex
- concave
- zoom

### Autres options
- controls: afficher les contrôles de navigation
- progress: afficher la barre de progression
- center: centrer le contenu
- hash: utiliser des URL avec hash pour les diapositives
- slideNumber: afficher les numéros de diapositive

## Ressources supplémentaires

- [Documentation officielle de Reveal.js](https://revealjs.com/)
- [GitHub de Reveal.js](https://github.com/hakimel/reveal.js/)
- [Exemples de présentations](https://revealjs.com/demo/)
