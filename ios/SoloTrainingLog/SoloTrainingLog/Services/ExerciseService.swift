import Foundation

enum ExerciseService {
    static func list(query: String? = nil, category: ExerciseCategory? = nil) async throws -> [Exercise] {
        var queryItems: [URLQueryItem] = []
        if let query, !query.isEmpty {
            queryItems.append(URLQueryItem(name: "q", value: query))
        }
        if let category {
            queryItems.append(URLQueryItem(name: "category", value: category.rawValue))
        }
        return try await APIClient.shared.request(
            "/api/exercises",
            queryItems: queryItems.isEmpty ? nil : queryItems
        )
    }

    static func create(_ request: CreateExerciseRequest) async throws -> Exercise {
        try await APIClient.shared.request(
            "/api/exercises",
            method: "POST",
            body: request
        )
    }
}
