import Foundation

enum AuthService {
    static func login(email: String, password: String) async throws -> AuthResponse {
        struct LoginBody: Encodable {
            let email: String
            let password: String
        }
        let response: AuthResponse = try await APIClient.shared.request(
            "/api/auth/mobile",
            method: "POST",
            body: LoginBody(email: email, password: password)
        )
        KeychainService.saveToken(response.token)
        KeychainService.saveUser(response.user)
        return response
    }

    static func signup(name: String, email: String, password: String) async throws -> User {
        let body = SignupRequest(
            name: name,
            email: email,
            password: password,
            confirmPassword: password
        )
        let user: User = try await APIClient.shared.request(
            "/api/auth/signup",
            method: "POST",
            body: body
        )
        // Auto-login after signup
        let _ = try await login(email: email, password: password)
        return user
    }

    static func logout() {
        KeychainService.clearAll()
    }

    static func isLoggedIn() -> Bool {
        KeychainService.getToken() != nil
    }

    static func currentUser() -> User? {
        KeychainService.getUser()
    }
}
