# Contributing to VisuPedia

First off, thank you for considering contributing to VisuPedia.

Our mission is to build the world's largest open library of interactive visual explanations for technical concepts. Every contribution helps learners understand ideas through intuition rather than memorization.

---

# Ways to Contribute

You can contribute in many ways:

* Add a new visualization
* Improve an existing visualization
* Fix bugs
* Improve animations
* Improve explanations
* Add test cases
* Improve accessibility
* Improve documentation
* Report issues

---

# Before You Start

Please check:

* Existing Issues
* Open Pull Requests
* Project Roadmap

Before creating a new visualization, make sure a similar page does not already exist.

---

# Project Structure

A visualization typically lives in its own folder:

```text
content/
└── graph/
    └── dijkstra/
        ├── page.tsx
        ├── metadata.ts
        ├── testcases.ts
        ├── README.md
        └── assets/
```

Every visualization should be self-contained.

---

# Creating a New Visualization

## Step 1: Choose a Topic

Examples:

* Binary Search
* AVL Tree
* Dijkstra Algorithm
* Backpropagation
* Monte Carlo Simulation
* Black-Scholes Model

---

## Step 2: Create a Folder

Example:

```text
content/
└── graph/
    └── bellman-ford/
```

---

## Step 3: Create Required Files

### page.tsx

Contains the visualization and interaction logic.

### metadata.ts

Contains searchable metadata.

Example:

```ts
export const metadata = {
  title: "Bellman-Ford Algorithm",

  category: "graph",

  topics: [
    "graph",
    "shortest-path"
  ],

  keywords: [
    "negative weights",
    "shortest path",
    "graph"
  ],

  difficulty: "medium"
};
```

### testcases.ts

Contains example inputs used by the visualization.

### README.md

Explains:

* What the visualization teaches
* How it works
* Known limitations

---

# Visualization Requirements

Every visualization should:

✅ Render correctly

✅ Explain a concept clearly

✅ Support stepping through execution

✅ Handle edge cases

✅ Work on desktop and mobile

✅ Follow project styling

---

# Design Principles

Prioritize:

1. Understanding
2. Accuracy
3. Simplicity

Not:

1. Fancy animations
2. Visual effects
3. Complexity

A simple visualization that teaches well is preferred over an impressive visualization that confuses users.

---

# AI-Generated Contributions

AI-assisted contributions are welcome.

Before submitting:

* Verify correctness
* Test interactions
* Check animations
* Review generated explanations

Contributors are responsible for reviewing AI-generated content.

---

# Contribution Workflow

1. Fork the repository

2. Create a branch

```bash
git checkout -b feature/bellman-ford
```

3. Implement your changes

4. Run validation

```bash
npm run lint
npm run test
npm run validate
```

5. Commit

```bash
git commit -m "Add Bellman-Ford visualization"
```

6. Push

```bash
git push origin feature/bellman-ford
```

7. Open a Pull Request

---

# Pull Request Checklist

Before submitting:

* [ ] Visualization works correctly
* [ ] Metadata is complete
* [ ] Edge cases are handled
* [ ] Code passes linting
* [ ] README is included
* [ ] Mobile layout is tested
* [ ] Accessibility considered

---

# What Makes a Great Contribution

Great contributions:

* Build intuition
* Explain why something works
* Include interactive controls
* Include meaningful examples
* Include edge cases
* Link related concepts

Example:

A Dijkstra visualization that explains priority queues and shortest-path relaxation is more valuable than one that simply animates node colors.

---

# Reporting Bugs

Please include:

* Browser version
* Screenshots (if applicable)
* Reproduction steps
* Expected behavior
* Actual behavior

---

# Review Process

Maintainers review contributions for:

* Technical correctness
* Educational value
* Code quality
* Accessibility
* Consistency

Changes may be requested before approval.

---

# Our Goal

We are not building a collection of animations.

We are building a visual encyclopedia that helps people understand difficult concepts through interaction.

Every contribution should make learning easier for someone else.

Thank you for helping build VisuPedia.
