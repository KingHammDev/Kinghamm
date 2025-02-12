export async function checkPermission(userId, moduleId, actionId) {
    try {
      const response = await fetch(`/api/auth/check-permission?userId=${userId}&moduleId=${moduleId}&actionId=${actionId}`);
      const data = await response.json();
      return data.hasPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }