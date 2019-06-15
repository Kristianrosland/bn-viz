const BACKWARD = 'backward'
const FORWARD = 'forward'

/**
 *  Visit a neighboring node.
 * 
 * @param {*} lastDirection Either 'forward' or 'backward', dependending on which directing we traversed to reach '
 * @param {*} currentPath A list of node id's describing the current path. Used to store all paths from source to target
 */
const visitNode = (graph, v, lastNode, lastDirection, currentPath, visited, target) => {
    const vis = [v, ...visited]
    const path = [...currentPath]
    if (lastNode !== undefined)
        path.push(lastDirection === FORWARD ? {source: lastNode, target: v} : {source: v, target: lastNode})

    if (v === target) { // If we have reached the target, store the path we used
        graph.allPaths.push([...path])
        return
    }

    if (lastDirection === FORWARD) {
        // Active Head-to-Head triplet (v-structure)
        if (graph.hasActiveDescendant[v]) {
            for (const u of graph[v].incoming) {
                if (!vis.includes(u)) {
                    visitNode(graph, u, v, BACKWARD, [...path], [...vis], target)
                }
            }
        }

        // Active Head-to-Tail triplet
        if (!graph.blocked[v]) {
            for (const u of graph[v].outgoing) {
                if (!vis.includes(u)) {
                    visitNode(graph, u, v, FORWARD, [...path], [...vis], target) 
                }
            }
        }
    } else if (lastDirection === BACKWARD) {
        // Active Tail-to-Head triplet or Tail-to-Tail triplet
        if (!graph.blocked[v]) {
            for (const u of graph[v].incoming) {
                if (!vis.includes(u)) {
                    visitNode(graph, u, v, BACKWARD, [...path], [...vis], target)
                }
            }
            for (const u of graph[v].outgoing) {
                if (!vis.includes(u)) {
                    visitNode(graph, u, v, FORWARD, [...path], [...vis], target)
                }
            }
        }
    }
}


/**
 *  Traverse backwards from e and mark all nodes as "hasActiveDescendant"
 */
const backUp = (graph, e) => {
    graph.hasActiveDescendant[e] = true;

    for (const v of graph[e].incoming) {
        if (!graph.hasActiveDescendant[v]) {
            backUp(graph, v)
        }
    }
}

/**
 *  Find all active trails from 'source' to 'target':
 *      - Start by building a more convenient graph object
 *      - Mark evidence nodes as blocked
 *      - Start from all evidence nodes and recurse parents, marking them as 'hasActiveDescendant = true'
 *          - This is used to check if an 'explaining away' trail is active
 *      - Recurse from source, following the rules of blocked and active trails, seeking the target node. 
 */
export const findActiveTrails = (nodes, arcs, source, target, evidence) => {
    const graph = { blocked: {}, hasActiveDescendant: {}, allPaths: [], source: source, target: target }
    nodes.forEach(n => {
        graph[n.id] = { incoming: [], outgoing: [] };
        graph.blocked[n.id] = evidence.includes(n.id)
        graph.hasActiveDescendant[n.id] = evidence.includes(n.id)
    })
    arcs.forEach(({source, target}) => {
        graph[source.id].outgoing.push(target.id);
        graph[target.id].incoming.push(source.id);
    })

    for (const e of evidence) {
        backUp(graph, e)
    }

    visitNode(graph, source, undefined, BACKWARD, [], [], target)

    return graph.allPaths
}

