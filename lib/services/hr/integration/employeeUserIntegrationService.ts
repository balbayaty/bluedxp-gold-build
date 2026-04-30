/**
 * Employee-User Integration Service
 * Integration between HR employees and user accounts
 */

export interface EmployeeUserLink {
  employeeId: string;
  userId: string;
  linkedAt: Date | string;
}

class EmployeeUserIntegrationService {
  private links: Map<string, EmployeeUserLink> = new Map();

  /**
   * Link employee to user account
   */
  async linkEmployeeToUser(
    employeeId: string,
    userId: string,
  ): Promise<EmployeeUserLink> {
    const link: EmployeeUserLink = {
      employeeId,
      userId,
      linkedAt: new Date().toISOString(),
    };
    this.links.set(employeeId, link);
    return link;
  }

  /**
   * Get user ID for employee
   */
  async getUserIdForEmployee(employeeId: string): Promise<string | null> {
    const link = this.links.get(employeeId);
    return link?.userId || null;
  }

  /**
   * Get employee ID for user
   */
  async getEmployeeIdForUser(userId: string): Promise<string | null> {
    const link = Array.from(this.links.values()).find(
      (l) => l.userId === userId,
    );
    return link?.employeeId || null;
  }
}

export const employeeUserIntegrationService =
  new EmployeeUserIntegrationService();
