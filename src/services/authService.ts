// Authentication service for handling user email storage and API headers
class AuthService {
  private userEmail: string | null = null;
  private userName: string | null = null;

  // Set user information from Google OAuth
  setUser(user: { email: string; name: string }) {
    this.userEmail = user.email;
    this.userName = user.name;
    
    // Store in localStorage for persistence
    localStorage.setItem('userAuth', JSON.stringify({
      email: user.email,
      name: user.name
    }));
    
    console.log('✅ User authenticated:', user.email);
  }

  // Get current user email
  getUserEmail(): string | null {
    if (!this.userEmail) {
      // Try to load from localStorage
      const saved = localStorage.getItem('userAuth');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.userEmail = parsed.email;
          this.userName = parsed.name;
        } catch (error) {
          console.error('Error parsing saved user auth:', error);
          localStorage.removeItem('userAuth');
        }
      }
    }
    
    return this.userEmail;
  }

  // Get current user name
  getUserName(): string | null {
    this.getUserEmail(); // This will load from localStorage if needed
    return this.userName;
  }

  // Get authentication headers for API requests
  getAuthHeaders(): Record<string, string> {
    const email = this.getUserEmail();
    
    if (email) {
      return {
        'x-user-email': email
      };
    }
    
    return {};
  }

  // Clear user authentication
  clearAuth() {
    this.userEmail = null;
    this.userName = null;
    localStorage.removeItem('userAuth');
    console.log('✅ User authentication cleared');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getUserEmail() !== null;
  }
}

// Export a singleton instance
export const authService = new AuthService(); 