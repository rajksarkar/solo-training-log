import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct SignupRequest: Codable {
    let name: String
    let email: String
    let password: String
    let confirmPassword: String
}
