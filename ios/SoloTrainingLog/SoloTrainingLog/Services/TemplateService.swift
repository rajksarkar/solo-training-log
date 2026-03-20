import Foundation

enum TemplateService {
    static func list() async throws -> [SessionTemplate] {
        try await APIClient.shared.request("/api/templates")
    }

    static func get(id: String) async throws -> SessionTemplate {
        try await APIClient.shared.request("/api/templates/\(id)")
    }

    static func create(_ request: CreateTemplateRequest) async throws -> SessionTemplate {
        try await APIClient.shared.request(
            "/api/templates",
            method: "POST",
            body: request
        )
    }

    static func delete(id: String) async throws {
        try await APIClient.shared.request("/api/templates/\(id)", method: "DELETE")
    }

    static func addExercise(templateId: String, request: AddTemplateExerciseRequest) async throws -> TemplateExercise {
        try await APIClient.shared.request(
            "/api/templates/\(templateId)/exercises",
            method: "POST",
            body: request
        )
    }

    static func removeExercise(templateId: String, exerciseId: String) async throws {
        try await APIClient.shared.request(
            "/api/templates/\(templateId)/exercises/\(exerciseId)",
            method: "DELETE"
        )
    }
}
