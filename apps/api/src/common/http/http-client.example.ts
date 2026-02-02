/**
 * HTTP Client Service Usage Examples
 *
 * This file demonstrates how to use HttpClientService in your NestJS services.
 * DO NOT import this file in production code - it's for reference only.
 */

import { Injectable } from '@nestjs/common';
import { HttpClientService } from './http-client.service';

// Example response interfaces
interface UserResponse {
  id: number;
  name: string;
  email: string;
}

interface PostResponse {
  id: number;
  title: string;
  content: string;
  userId: number;
}

@Injectable()
export class ExampleService {
  constructor(private readonly httpClient: HttpClientService) {}

  /**
   * Example 1: Simple GET request
   */
  async getUsers(): Promise<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>('/users');
  }

  /**
   * Example 2: GET request with query parameters
   */
  async getUserById(id: number): Promise<UserResponse> {
    return this.httpClient.get<UserResponse>(`/users/${id}`);
  }

  /**
   * Example 3: GET request with custom headers
   */
  async getUsersWithAuth(token: string): Promise<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>('/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Example 4: POST request with body
   */
  async createUser(userData: { name: string; email: string }): Promise<UserResponse> {
    return this.httpClient.post<UserResponse>('/users', userData);
  }

  /**
   * Example 5: POST request with custom timeout
   */
  async createUserWithTimeout(userData: { name: string; email: string }): Promise<UserResponse> {
    return this.httpClient.post<UserResponse>('/users', userData, {
      timeout: 5000, // 5 seconds
    });
  }

  /**
   * Example 6: PUT request
   */
  async updateUser(id: number, userData: Partial<UserResponse>): Promise<UserResponse> {
    return this.httpClient.put<UserResponse>(`/users/${id}`, userData);
  }

  /**
   * Example 7: PATCH request
   */
  async patchUser(id: number, userData: Partial<UserResponse>): Promise<UserResponse> {
    return this.httpClient.patch<UserResponse>(`/users/${id}`, userData);
  }

  /**
   * Example 8: DELETE request
   */
  async deleteUser(id: number): Promise<void> {
    await this.httpClient.delete(`/users/${id}`);
  }

  /**
   * Example 9: Generic request method with custom options
   */
  async makeCustomRequest(): Promise<unknown> {
    return this.httpClient.request('/custom-endpoint', {
      method: 'POST',
      body: { data: 'value' },
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
      retry: 5, // Override default retry attempts
      retryDelay: 2000, // Override default retry delay
    });
  }

  /**
   * Example 10: Create custom client for specific service
   */
  async useCustomClient(): Promise<PostResponse[]> {
    const customClient = this.httpClient.createCustomClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 10000,
      headers: {
        'X-API-Key': 'your-api-key',
      },
    });

    return customClient<PostResponse[]>('/posts');
  }

  /**
   * Example 11: Error handling with try-catch
   */
  async getUserWithErrorHandling(id: number): Promise<UserResponse | null> {
    try {
      return await this.httpClient.get<UserResponse>(`/users/${id}`);
    } catch (error) {
      // Error is already logged by HttpClientService
      // Handle error according to your business logic
      return null;
    }
  }

  /**
   * Example 12: Multiple parallel requests
   */
  async getMultipleResources(): Promise<{
    users: UserResponse[];
    posts: PostResponse[];
  }> {
    const [users, posts] = await Promise.all([
      this.httpClient.get<UserResponse[]>('/users'),
      this.httpClient.get<PostResponse[]>('/posts'),
    ]);

    return { users, posts };
  }

  /**
   * Example 13: Request with query parameters using params option
   */
  async searchUsers(query: string, page: number): Promise<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>('/users/search', {
      query: {
        q: query,
        page: page.toString(),
        limit: '10',
      },
    });
  }

  /**
   * Example 14: File upload with FormData
   */
  async uploadFile(file: Buffer, filename: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', new Blob([file]), filename);

    return this.httpClient.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Example 15: Response with custom status code handling
   */
  async getUserWithCustomHandling(id: number): Promise<UserResponse | null> {
    try {
      return await this.httpClient.get<UserResponse>(`/users/${id}`, {
        ignoreResponseError: false, // Will throw on non-2xx status codes
      });
    } catch (error) {
      // Handle specific status codes
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { status: number } }).response;
        if (response.status === 404) {
          return null; // User not found is acceptable
        }
      }
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Example Module Setup
 *
 * Since HttpClientModule is a global module, you don't need to import it
 * in your feature modules. Just inject HttpClientService in your services:
 */

/*
import { Module } from '@nestjs/common';
import { ExampleService } from './example.service';
import { ExampleController } from './example.controller';

@Module({
  // No need to import HttpClientModule - it's global
  controllers: [ExampleController],
  providers: [ExampleService],
})
export class ExampleModule {}
*/
