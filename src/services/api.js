
const BASE_URL = import.meta.env.VITE_APP_BACKEND_API_URL;

/**
 * @param {string} algorithm  - e.g. "BFS", "A*", "Hill Climbing"
 * @param {Object} graphPayload - { nodes, edges, start, goal }
 * @returns {Promise<{ steps: Array, path: Array, cost: number }>}
 */
export async function runAlgorithm(algorithm, graphPayload) {
    const response = await fetch(`${BASE_URL}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm, ...graphPayload }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Server error: ${response.status}`);
    }

    return response.json(); 
}