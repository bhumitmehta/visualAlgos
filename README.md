# 📊 AlgoViz: The Interactive Algorithm Encyclopedia

> **Imagine if Wikipedia articles had interactive, step-by-step visualizations built right into them.**

AlgoViz is a modern, open-source platform for learning and teaching computer science algorithms. It bridges the gap between static textbook explanations and isolated visualizer tools by providing a **unified, interactive template** where code, state, and visual representations are perfectly synchronized.

Currently featuring a deep-dive into **Dynamic Programming (Edit Distance)**, the architecture is designed to easily scale to hundreds of algorithms—from Graph Traversals to Sorting and Tree Balancing.

---

## ✨ Key Features

* 🎬 **Step-by-Step Playback:** Play, pause, step forward, and adjust animation speed with precision.
* 🔄 **Multi-Solution Comparison:** Toggle between different approaches (e.g., O(M · N) Space DP vs. O(N) Space-Optimized DP) and watch the memory footprint shrink in real-time.
* 💻 **Synchronized Code Highlighting:** The exact line of C++/Python/Java code being executed is highlighted in the editor as the visualizer advances.
* 🧪 **Custom Inputs:** Don't just read about "horse" and "ros". Type in your own strings or arrays and watch the algorithm solve your specific problem.
* 🧠 **Traceback & Intuition:** Visualizes not just the final answer, but the exact path of decisions (the "traceback") the algorithm took to get there.
* 📱 **Responsive Design:** Built with Tailwind CSS to look beautiful on both ultrawide monitors and mobile screens.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **State Management:** Native React Hooks (`useState`, `useEffect`, `useRef`)

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+ and npm/yarn/pnpm

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/algoviz.git
cd algoviz
```

2. **Install dependencies:**

```bash
npm install

# or

pnpm install
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open your browser:**

Navigate to `http://localhost:3000` to see the interactive encyclopedia in action.

---

## 🏗️ Architecture: The "Step" Abstraction

The core philosophy of AlgoViz is **separation of logic and rendering**.

To add a new algorithm, you don't touch the UI. You only write a function that generates an array of `Step` objects. The `AlgoVizTemplate` handles the rest.

```typescript
interface Step {
  phase: 'init' | 'process' | 'done';
  message: string;
  activeI: number;
  activeJ: number;
  dpTable: number[][];
}
```

### The Playback Engine (`usePlayback`)

Animations are driven by a custom `usePlayback` hook. Instead of using `setInterval` (which can cause janky frames and React linting errors), it uses a **recursive `setTimeout` pattern**. This guarantees exact delays between frames and naturally handles auto-pausing at the end of the sequence.

---

## 📖 Currently Featured Algorithms

### 1. Edit Distance (Levenshtein Distance)

* **Category:** Dynamic Programming
* **Concepts:** 2D DP Tables, Space Optimization, Traceback.
* **Visuals:** Cell-by-cell grid filling, operation arrows (Insert/Delete/Replace), and a golden traceback path showing the optimal sequence of edits.

*(More algorithms coming soon! See the Roadmap below.)*

---

## 🤝 Contributing: Adding a New Algorithm

We want AlgoViz to be the "Wikipedia" of algorithms, which means we need the community!

To add a new algorithm (e.g., Dijkstra's, Merge Sort, Knapsack):

1. Create a new file in `algorithms/` (e.g., `dijkstra.ts`).
2. Write a `buildDijkstraSteps(graph)` function that returns a `Step[]` array.
3. Create a new UI panel in `components/panels/` if your algorithm requires a unique visual (like a Graph node-link diagram instead of a 2D grid).
4. Submit a Pull Request!

*Check out `CONTRIBUTING.md` for detailed guidelines on the `Step` interface.*

---

## 🗺️ Roadmap

* [ ] **Graph Algorithms:** Dijkstra, A*, BFS/DFS with interactive node dragging.
* [ ] **Sorting Algorithms:** QuickSort, MergeSort, and HeapSort visualizations.
* [ ] **Tree Structures:** AVL Trees, Red-Black Trees, and Tries with rotation animations.
* [ ] **Multi-Language Support:** Python, Java, C++, and JavaScript code views.
* [ ] **Mobile Touch Gestures:** Swipe to step forward/backward.
* [ ] **Dark Mode:** Because every developer tool needs it.

---

## 📜 License

This project is open source and available under the MIT License.

---

<p align="center">
  <i>Built with ❤️ for the developer community. Let's make algorithms visual.</i>
</p>
