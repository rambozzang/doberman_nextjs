import ApiClient from '@/lib/api';
import { ApiResponse, PaginationData } from '@/types/api';

// 예시 데이터 타입들
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// 게시글 관련 서비스
export class PostService {
  // 게시글 목록 조회 (공개 - 로그인 불필요)
  static async getPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginationData<Post>>> {
    return await ApiClient.get<PaginationData<Post>>(`/posts?page=${page}&limit=${limit}`);
  }

  // 게시글 상세 조회 (공개)
  static async getPost(id: string): Promise<ApiResponse<Post>> {
    return await ApiClient.get<Post>(`/posts/${id}`);
  }

  // 게시글 생성 (인증 필요)
  static async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    return await ApiClient.postPrivate<Post>('/posts', data);
  }

  // 게시글 수정 (인증 필요)
  static async updatePost(id: string, data: UpdatePostRequest): Promise<ApiResponse<Post>> {
    return await ApiClient.putPrivate<Post>(`/posts/${id}`, data);
  }

  // 게시글 삭제 (인증 필요)
  static async deletePost(id: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.deletePrivate<{ message: string }>(`/posts/${id}`);
  }

  // 내 게시글 목록 (인증 필요)
  static async getMyPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginationData<Post>>> {
    return await ApiClient.getPrivate<PaginationData<Post>>(`/posts/my?page=${page}&limit=${limit}`);
  }
}

// 사용자 관련 서비스
export class UserService {
  // 사용자 프로필 조회 (인증 필요)
  static async getProfile(): Promise<ApiResponse<User>> {
    return await ApiClient.getPrivate<User>('/users/profile');
  }

  // 사용자 프로필 수정 (인증 필요)
  static async updateProfile(data: { name?: string; email?: string }): Promise<ApiResponse<User>> {
    return await ApiClient.putPrivate<User>('/users/profile', data);
  }

  // 비밀번호 변경 (인증 필요)
  static async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.putPrivate<{ message: string }>('/users/change-password', data);
  }

  // 계정 삭제 (인증 필요)
  static async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.deletePrivate<{ message: string }>('/users/account');
  }
}

// 파일 업로드 서비스
export class FileService {
  // 파일 업로드 (인증 필요)
  static async uploadFile(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    return await ApiClient.postPrivate<{ url: string; filename: string }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 이미지 업로드 (인증 필요)
  static async uploadImage(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    return await ApiClient.postPrivate<{ url: string; filename: string }>('/files/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
} 