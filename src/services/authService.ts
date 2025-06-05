// Authentication service for handling user email storage and API headers
class AuthService {
  private userEmail: string | null = null;
  private userName: string | null = null;
  private userRole: string | null = null;
  private userPicture: string | null = null;

  // Validate user with backend before setting authentication
  async validateAndSetUser(user: { email: string; name: string; picture?: string }): Promise<{ success: boolean; error?: string; role?: string }> {
    try {
      console.log('🔍 Validating user with backend:', user.email);
      
      // Check if user is authorized with backend
      const response = await fetch('/api/users/authorized', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          return { 
            success: false, 
            error: errorData.message || 'Your email is not authorized to access this application. Please contact your administrator.' 
          };
        }
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const currentUser = data.currentUser;
      
      if (!currentUser) {
        return { 
          success: false, 
          error: 'User authorization could not be verified. Please contact your administrator.' 
        };
      }

      // Set authenticated user
      this.userEmail = user.email;
      this.userName = user.name;
      this.userRole = currentUser.role;
      this.userPicture = user.picture || '';
      
      // Store in localStorage for persistence
      localStorage.setItem('userAuth', JSON.stringify({
        email: user.email,
        name: user.name,
        role: currentUser.role,
        picture: user.picture || ''
      }));
      
      console.log('✅ User authenticated and authorized:', user.email, 'Role:', currentUser.role);
      return { success: true, role: currentUser.role };
      
    } catch (error) {
      console.error('❌ User validation failed:', error);
      return { 
        success: false, 
        error: 'Unable to validate user authorization. Please try again or contact support.' 
      };
    }
  }

  // Set user information directly (for local development)
  setUser(user: { email: string; name: string }) {
    this.userEmail = user.email;
    this.userName = user.name;
    this.userRole = 'admin'; // Default to admin for local development
    this.userPicture = '';
    
    // Store in localStorage for persistence
    localStorage.setItem('userAuth', JSON.stringify({
      email: user.email,
      name: user.name,
      role: 'admin',
      picture: ''
    }));
    
    console.log('✅ User authenticated (local development):', user.email);
  }

  // Get current user email
  getUserEmail(): string | null {
    if (!this.userEmail) {
      this.loadFromStorage();
    }
    return this.userEmail;
  }

  // Get current user name
  getUserName(): string | null {
    if (!this.userName) {
      this.loadFromStorage();
    }
    return this.userName;
  }

  // Get current user role
  getUserRole(): string | null {
    if (!this.userRole) {
      this.loadFromStorage();
    }
    return this.userRole;
  }

  // Get current user picture
  getUserPicture(): string | null {
    if (!this.userPicture) {
      this.loadFromStorage();
    }
    return this.userPicture;
  }

  // Get user info object
  getUserInfo(): { email: string; name: string; role: string; picture: string } | null {
    if (!this.userEmail) {
      this.loadFromStorage();
    }
    
    if (!this.userEmail || !this.userName || !this.userRole) {
      return null;
    }

    return {
      email: this.userEmail,
      name: this.userName,
      role: this.userRole,
      picture: this.userPicture || ''
    };
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // Load user data from localStorage
  private loadFromStorage(): void {
    const saved = localStorage.getItem('userAuth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.userEmail = parsed.email;
        this.userName = parsed.name;
        this.userRole = parsed.role || 'user';
        this.userPicture = parsed.picture || '';
      } catch (error) {
        console.error('Error parsing saved user auth:', error);
        localStorage.removeItem('userAuth');
      }
    }
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
    this.userRole = null;
    this.userPicture = null;
    localStorage.removeItem('userAuth');
    console.log('✅ User authentication cleared');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getUserEmail() !== null && this.getUserRole() !== null;
  }
}

// Export a singleton instance
export const authService = new AuthService(); 