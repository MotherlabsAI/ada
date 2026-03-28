import { WORKSPACE_PACKAGE_NODES } from "@ada/ent";
import type { WorkspacePackageName, WorkspacePackageNode } from "@ada/ent";

export type { WorkspacePackageName, WorkspacePackageNode };
export { WORKSPACE_PACKAGE_NODES };

/**
 * WorkspacePackageScanner
 *
 * Scans the pnpm monorepo workspace structure to discover and model
 * WorkspacePackageNode instances. Maps each package to its assigned
 * component IDs. Provides the workspace topology needed by
 * C3GapCollapseResolver to determine which package the ordinal-3
 * component should collapse into.
 */
export class WorkspacePackageScanner {
  private readonly nodes: WorkspacePackageNode[];

  constructor(nodes?: WorkspacePackageNode[]) {
    this.nodes = nodes ?? WORKSPACE_PACKAGE_NODES;
  }

  scanWorkspace(): WorkspacePackageNode[] {
    return [...this.nodes];
  }

  getPackageNode(packageName: WorkspacePackageName): WorkspacePackageNode {
    const node = this.nodes.find((n) => n.packageName === packageName);
    if (!node) {
      throw new Error(
        `No WorkspacePackageNode found for package: ${packageName}`,
      );
    }
    return node;
  }

  resolvePackageForComponent(
    componentId: string,
    nodes: WorkspacePackageNode[],
  ): WorkspacePackageNode {
    const node = nodes.find((n) =>
      n.assignedComponentIds.includes(componentId),
    );
    if (!node) {
      throw new Error(
        `No workspace package found for componentId: ${componentId}`,
      );
    }
    return node;
  }
}
