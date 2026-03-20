import Foundation

struct Exercise: Codable, Identifiable, Hashable {
    let id: String
    let ownerId: String?
    let name: String
    let category: ExerciseCategory
    let equipment: [String]
    let muscles: [String]
    let instructions: String
    let youtubeId: String?
    let createdAt: String

    var isCustom: Bool { ownerId != nil }
}

struct CreateExerciseRequest: Codable {
    let name: String
    let category: String
    var equipment: [String]?
    var muscles: [String]?
    var instructions: String?
    var youtubeId: String?
}
