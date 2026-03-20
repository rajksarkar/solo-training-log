import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isCheckingAuth = true
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    init() {
        checkAuth()
    }

    func checkAuth() {
        if AuthService.isLoggedIn() {
            currentUser = AuthService.currentUser()
            isAuthenticated = true
        }
        isCheckingAuth = false
    }

    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await AuthService.login(email: email, password: password)
            currentUser = response.user
            isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signup(name: String, email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await AuthService.signup(name: name, email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func logout() {
        AuthService.logout()
        currentUser = nil
        isAuthenticated = false
    }
}
