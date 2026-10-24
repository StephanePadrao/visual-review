# 🎯 Visual Review (PinPoint / InSitu Feedback DevTools)

> **Inspecteur visuel, annotations en direct et créateur de tickets / prompts IA en 1 clic.**
> Un outil universel pour collecter des feedbacks précis directement sur l'interface de n'importe quelle application web.

---

## 📌 Présentation & Vision Produit

Lors des phases de recette, de QA, de polish d'interface ou de développement assisté par IA, expliquer un défaut visuel ou fonctionnel (« *le bouton en haut à droite dépasse de 10px* », « *la colonne se chevauche sur mobile* ») est chronophage, imprécis et source d'incompréhensions.

**Visual Review** permet à n'importe quel utilisateur ou testeur :
1. D'activer un **Mode Revue** via un raccourci clavier (`Cmd + Shift + R`) ou un bouton flottant discret.
2. De survoler les éléments de la page avec un **halo de détection automatique**.
3. De poser des **pastilles numérotées persistantes (①, ②, ③...)** par simple clic ou par sélection d'une zone rectangulaire (drag-and-drop).
4. De saisir une consigne textuelle rapide dans un **mini popover inline**.
5. D'ouvrir un tiroir de session récapitulatif pour :
   - **Générer un ticket GitHub complet en 1 clic** (titre pré-rempli, captures d'écran HD miniaturisées, sélecteurs CSS précis, classes Tailwind, résolution d'écran, URL).
   - **Copier un Prompt IA structuré** prêt à coller dans ChatGPT / Claude / Gemini pour exécution immédiate.
6. De **réinitialiser automatiquement la session** une fois le ticket créé (disparition des pastilles, nettoyage de l'écran, notification toast).

---

## 🏗️ Formats de Distribution Envisagés

Le projet a vocation à être déployé sous 3 formes complémentaires :

```
┌────────────────────────────────────────────────────────┐
│                   VISUAL REVIEW CORE                   │
│ (Moteur de capture, sélecteurs DOM, formatters Markdown)│
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   [Package NPM]     [Extension Web]    [Script CDN]
    React / Next      Chrome, Edge,       Universal
    / Vite / Vue           Arc           Shadow DOM
```

### 1. Package NPM (Drop-in Component)
Pour les projets React / Next.js / Vite / Remix / Astro :
```bash
pnpm add visual-review
```
```tsx
import { VisualReview } from "visual-review";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV !== "production" && (
          <VisualReview repo="mon-orga/mon-projet" />
        )}
      </body>
    </html>
  );
}
```

### 2. Extension Navigateur (Zero-Code)
- S'injecte sur **n'importe quel site web** (React, Vue, WordPress, Webflow, PHP, etc.) en local ou en production.
- Conserve vos clés API / Personal Access Token GitHub dans le stockage sécurisé du navigateur.

### 3. Script CDN Universel (Embed Widget)
- Une balise `<script>` dans le `<head>` avec encapsulation en **Shadow DOM** pour ne pas subir les styles CSS de l'application hôte.

---

## 🛠️ Spécifications Fonctionnelles & Architecture

### A. Composants Clés
- **`<VisualReviewToolbar />`** : Bouton flottant discret, badge compteur dynamique, bascule Mode Navigation / Mode Revue.
- **`<VisualReviewOverlay />`** : Halo de survol, boîte de sélection par drag-and-drop, pastilles numérotées attachées dynamiquement aux éléments du DOM, popovers inline clampés à l'écran.
- **`<VisualReviewDrawer />`** : Panneau latéral récapitulatif, liste ordonnée, aperçu / lightbox des miniatures, champ de titre avec détection intelligente de page, sélecteur de label (`bug`, `enhancement`), export GitHub & Prompt IA.
- **`<VisualReviewToast />`** : Toast de confirmation avec lien direct vers le ticket créé.

### B. Moteur Technique
- **Capture d'écran** : `html-to-image` avec compression automatique des vignettes (thumbnail JPEG) pour respecter le plafond strict de 65 536 caractères de l'API REST GitHub.
- **Détection DOM** : Générateur de sélecteurs hiérarchiques précis (`#id`, `[data-testid]`, `tag.classes:nth-child()`).
- **Extraction Tailwind / CSS** : Analyse des classes utilitaires pour fournir le contexte stylistique exact aux développeurs et aux LLM.
- **Authentification GitHub** : Support du token d'environnement (`GITHUB_TOKEN`), ou intégration directe avec GitHub CLI (`gh auth token`), ou Personal Access Token (PAT).

---

## 🗺️ Roadmap & Jalons

- [x] **Phase 1 : PoC & Validation Terrain** (Validé dans le projet [PEPPER](https://github.com/StephanePadrao/PEPPER) via Issue #27).
- [ ] **Phase 2 : Extraction en Monorepo** (pnpm workspace avec packages isolés : `core`, `react`, `extension`).
- [ ] **Phase 3 : Intégrations supplémentaires** (GitLab Issues, Jira, Linear, Slack webhooks).
- [ ] **Phase 4 : Extension de navigateur Chrome / WebExtensions**.
- [ ] **Phase 5 : Publication NPM publique / Open-Source**.

---

## 📄 Licence

MIT © [Stéphane Dos Santos Padrao](https://github.com/StephanePadrao)
