import { apiClient } from "./apiClient";
import type { User } from "./authService";

export interface UpdateMyProfileData {
  name?: string;
  contactNumber?: string;
  // BASIC_USER only — admins have no address column server-side.
  address?: string;
  // One of "avatar-01".."avatar-20" (see PRESET_AVATAR_IDS) — empty string
  // explicitly clears it back to an uploaded photo/initials.
  avatarId?: string;
}

class UserService {
  async getMyProfile(): Promise<User> {
    return apiClient.get<User>("/user/me");
  }

  // Multipart even without a photo: the backend only accepts this body as a
  // JSON string under a "data" field (see user.routes.ts's
  // update-my-profile), reserving the multipart "file" field for an actual
  // photo upload later. apiClient's request interceptor detects the
  // FormData body and strips the default JSON Content-Type so the correct
  // multipart boundary gets set automatically.
  async updateMyProfile(data: UpdateMyProfileData): Promise<User> {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    return apiClient.patch<User>("/user/update-my-profile", formData);
  }
}

export const userService = new UserService();
