/**
 * Application user
 */
export interface User {
  /**
   * Global identifier for the user
   */
  id: string;
  /**
   * User's full name
   */
  fullName: string;
  /**
   * User's email address
   */
  email: string;
  /**
   * User's group ids
   */
  organizations: string[];
  /**
   * User's roles
   */
  roles: string[];
  /**
   * Is user pending first time login
   */
  isPending?: boolean;
}
