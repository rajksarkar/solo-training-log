import Foundation

struct ProgressDataPoint: Codable, Identifiable {
    var id: String { date }
    let date: String
    let bestSet: BestSet?
    let volume: Double?
    let durationSec: Int?
    let rpe: Int?
}

struct BestSet: Codable {
    let weight: Double?
    let reps: Int?
    let unit: String?
}

struct ProgressResponse: Codable {
    let dataPoints: [ProgressDataPoint]
    let recentPRs: [ProgressDataPoint]
}

struct LastBestSet: Codable {
    let weight: Double?
    let reps: Int?
    let unit: String?
}

enum ProgressService {
    static func getExerciseProgress(exerciseId: String) async throws -> ProgressResponse {
        try await APIClient.shared.request("/api/progress/exercise/\(exerciseId)")
    }

    static func getLastBestSet(exerciseId: String) async throws -> LastBestSet {
        try await APIClient.shared.request("/api/progress/exercise/\(exerciseId)/last")
    }
}
