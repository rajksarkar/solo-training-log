import Foundation

struct SetLog: Codable, Identifiable {
    let id: String
    let sessionExerciseId: String
    let setIndex: Int
    var reps: Int?
    var weight: Double?
    var unit: WeightUnit
    var durationSec: Int?
    var distanceMeters: Int?
    var rpe: Int?
    var completed: Bool
    var notes: String?
}

enum WeightUnit: String, Codable, CaseIterable {
    case lb
    case kg
}

struct SetLogUpsert: Codable {
    let sessionExerciseId: String
    let setIndex: Int
    var reps: Int?
    var weight: Double?
    var unit: String = "lb"
    var durationSec: Int?
    var distanceMeters: Int?
    var rpe: Int?
    var completed: Bool = true
    var notes: String?
}

struct BulkUpsertLogsRequest: Codable {
    let logs: [SetLogUpsert]
}
