/**
 * Merkle Tree Implementation
 *
 * Builds Merkle tree for tamper-evident evidence packets
 * Provides proof generation and verification
 *
 * @module evidence
 */

import crypto from "crypto";

// ============================================================================
// MERKLE TREE TYPES
// ============================================================================

/**
 * Merkle tree node
 */
export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string; // Only for leaf nodes
  index?: number; // Position in original array
}

/**
 * Merkle proof path
 */
export interface MerkleProof {
  leafHash: string;
  path: Array<{
    hash: string;
    position: "left" | "right";
  }>;
  rootHash: string;
}

/**
 * Merkle tree structure
 */
export interface MerkleTree {
  root: MerkleNode;
  rootHash: string;
  leaves: MerkleNode[];
  depth: number;
  leafCount: number;
}

// ============================================================================
// MERKLE TREE BUILDER
// ============================================================================

export class MerkleTreeBuilder {
  /**
   * Build Merkle tree from data hashes
   */
  buildTree(data: string[]): MerkleTree {
    if (data.length === 0) {
      throw new Error("Cannot build Merkle tree from empty data");
    }

    // Create leaf nodes
    const leaves: MerkleNode[] = data.map((item, index) => ({
      hash: this.hash(item),
      data: item,
      index,
    }));

    // Build tree bottom-up
    const root = this.buildTreeRecursive(leaves);

    return {
      root,
      rootHash: root.hash,
      leaves,
      depth: this.calculateDepth(leaves.length),
      leafCount: leaves.length,
    };
  }

  /**
   * Build tree recursively
   */
  private buildTreeRecursive(nodes: MerkleNode[]): MerkleNode {
    if (nodes.length === 1) {
      return nodes[0];
    }

    const nextLevel: MerkleNode[] = [];

    // Pair nodes and hash together
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left; // Duplicate if odd number

      const combinedHash = this.hash(left.hash + right.hash);

      nextLevel.push({
        hash: combinedHash,
        left,
        right,
      });
    }

    return this.buildTreeRecursive(nextLevel);
  }

  /**
   * Generate proof for a specific leaf
   */
  generateProof(tree: MerkleTree, leafIndex: number): MerkleProof | null {
    if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
      return null;
    }

    const leaf = tree.leaves[leafIndex];
    const path: Array<{ hash: string; position: "left" | "right" }> = [];

    // Traverse from leaf to root
    let currentNode: MerkleNode | undefined = leaf;
    let currentIndex = leafIndex;

    while (currentNode && currentNode !== tree.root) {
      const parent = this.findParent(tree.root, currentNode);
      if (!parent) break;

      // Determine if current node is left or right child
      const isLeft = parent.left === currentNode;
      const sibling = isLeft ? parent.right : parent.left;

      if (sibling) {
        path.push({
          hash: sibling.hash,
          position: isLeft ? "right" : "left",
        });
      }

      currentNode = parent;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leafHash: leaf.hash,
      path,
      rootHash: tree.rootHash,
    };
  }

  /**
   * Verify proof
   */
  verifyProof(proof: MerkleProof, leafData: string, rootHash: string): boolean {
    // Hash the leaf data
    const leafHash = this.hash(leafData);

    if (leafHash !== proof.leafHash) {
      return false;
    }

    // Reconstruct hash from proof path
    let currentHash = leafHash;

    for (const step of proof.path) {
      if (step.position === "left") {
        // Sibling is on left, current is on right
        currentHash = this.hash(step.hash + currentHash);
      } else {
        // Sibling is on right, current is on left
        currentHash = this.hash(currentHash + step.hash);
      }
    }

    // Final hash should match root
    return currentHash === rootHash;
  }

  /**
   * Get root hash
   */
  getRootHash(tree: MerkleTree): string {
    return tree.rootHash;
  }

  /**
   * Verify tree integrity
   */
  verifyTreeIntegrity(tree: MerkleTree): boolean {
    // Rebuild tree and compare root hash
    const data = tree.leaves.map((leaf) => leaf.data || "");
    const rebuilt = this.buildTree(data);

    return rebuilt.rootHash === tree.rootHash;
  }

  /**
   * Find parent node
   */
  private findParent(root: MerkleNode, target: MerkleNode): MerkleNode | null {
    if (root === target) {
      return null; // Root has no parent
    }

    if (root.left === target || root.right === target) {
      return root;
    }

    if (root.left) {
      const found = this.findParent(root.left, target);
      if (found) return found;
    }

    if (root.right) {
      const found = this.findParent(root.right, target);
      if (found) return found;
    }

    return null;
  }

  /**
   * Calculate tree depth
   */
  private calculateDepth(leafCount: number): number {
    return Math.ceil(Math.log2(leafCount)) + 1;
  }

  /**
   * Hash function (SHA-256)
   */
  private hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Get all leaf hashes
   */
  getLeafHashes(tree: MerkleTree): string[] {
    return tree.leaves.map((leaf) => leaf.hash);
  }

  /**
   * Add leaf to tree (creates new tree)
   */
  addLeaf(tree: MerkleTree, newData: string): MerkleTree {
    const newLeaf: MerkleNode = {
      hash: this.hash(newData),
      data: newData,
      index: tree.leaves.length,
    };

    const newLeaves = [...tree.leaves, newLeaf];
    return this.buildTree(newLeaves.map((leaf) => leaf.data || ""));
  }

  /**
   * Remove leaf from tree (creates new tree)
   */
  removeLeaf(tree: MerkleTree, leafIndex: number): MerkleTree {
    if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
      throw new Error("Invalid leaf index");
    }

    const newLeaves = tree.leaves.filter((_, index) => index !== leafIndex);
    return this.buildTree(newLeaves.map((leaf) => leaf.data || ""));
  }
}

// Export singleton
export const merkleTreeBuilder = new MerkleTreeBuilder();
