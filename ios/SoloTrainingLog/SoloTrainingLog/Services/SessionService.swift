import Foundation

enum SessionService {
    static func list(from: Date? = nil, to: Date? = nil) async throws -> [Session] {
        var queryItems: [URLQueryItem] = []
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        if let from {
            queryItems.append(URLQueryItem(name: "from", value: formatter.string(from: from)))
        }
        if let to {
            queryItems.append(URLQueryItem(name: "to", value: formatter.string(from: to)))
        }
        return try await APIClient.shared.request(
            "/api/sessions",
            queryItems: queryItems.isEmpty ? nil : queryItems
        )
    }

    static func get(id: String) async throws -> Session {
        try await APIClient.shared.request("/api/sessions/\(id)")
    }

    static func create(_ request: CreateSessionRequest) async throws -> Session {
        try await APIClient.shared.request(
            "/api/sessions",
            method: "POST",
            body: request
        )
    }

    static func update(id: String, request: UpdateSessionRequest) async throws -> Session {
        try await APIClient.shared.request(
            "/api/sessions/\(id)",
            method: "PATCH",
            body: request
        )
    }

    static func delete(id: String) async throws {
        try await APIClient.shared.request("/api/sessions/\(id)", method: "DELETE")
    }

    static func addExercise(sessionId: String, request: AddSessionExerciseRequest) async throws -> SessionExercise {
        try await APIClient.shared.request(
            "/api/sessions/\(sessionId)/exercises",
            method: "POST",
            body: request
        )
    }

    static func bulkUpsertLogs(sessionId: String, logs: [SetLogUpsert]) async throws -> [SetLog] {
        try await APIClient.shared.request(
            "/api/sessions/\(sessionId)/logs",
            method: "POST",
            body: BulkUpsertLogsRequest(logs: logs)
        )
    }
}

struct UpdateSessionRequest: Codable {
    var title: String?
    var category: String?
    var date: String?
    var notes: String?
}
