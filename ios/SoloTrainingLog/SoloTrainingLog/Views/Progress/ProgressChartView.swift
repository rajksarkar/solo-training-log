import SwiftUI
import Charts

struct ProgressChartView: View {
    let exercise: Exercise
    @StateObject private var viewModel = ProgressViewModel()

    var body: some View {
        ZStack {
            Theme.Colors.surface.ignoresSafeArea()

            if viewModel.isLoading {
                LoadingView()
            } else if viewModel.dataPoints.isEmpty {
                EmptyStateView(
                    icon: "chart.xyaxis.line",
                    title: "No data yet",
                    message: "Log some sets for \(exercise.name) to see your progress"
                )
            } else {
                ScrollView {
                    VStack(spacing: 24) {
                        // Weight over time chart
                        if viewModel.dataPoints.contains(where: { $0.bestSet?.weight != nil }) {
                            ChartCard(title: "Best Weight Over Time") {
                                Chart(viewModel.dataPoints.filter { $0.bestSet?.weight != nil }) { point in
                                    LineMark(
                                        x: .value("Date", point.date),
                                        y: .value("Weight", point.bestSet?.weight ?? 0)
                                    )
                                    .foregroundStyle(Theme.Colors.primary)
                                    .lineStyle(StrokeStyle(lineWidth: 2))

                                    PointMark(
                                        x: .value("Date", point.date),
                                        y: .value("Weight", point.bestSet?.weight ?? 0)
                                    )
                                    .foregroundStyle(Theme.Colors.primary)
                                }
                                .chartYAxisLabel("Weight")
                                .frame(height: 200)
                            }
                        }

                        // Volume over time
                        if viewModel.dataPoints.contains(where: { $0.volume != nil && $0.volume! > 0 }) {
                            ChartCard(title: "Volume Over Time") {
                                Chart(viewModel.dataPoints.filter { $0.volume != nil && $0.volume! > 0 }) { point in
                                    BarMark(
                                        x: .value("Date", point.date),
                                        y: .value("Volume", point.volume ?? 0)
                                    )
                                    .foregroundStyle(Theme.Colors.primaryContainer)
                                }
                                .chartYAxisLabel("Volume (weight x reps)")
                                .frame(height: 200)
                            }
                        }

                        // Recent PRs
                        if !viewModel.recentPRs.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("RECENT PRs")
                                    .font(Theme.Fonts.labelSmall)
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                    .tracking(1)

                                ForEach(viewModel.recentPRs) { pr in
                                    HStack {
                                        Image(systemName: "trophy.fill")
                                            .foregroundStyle(Theme.Colors.tertiary)
                                            .font(.system(size: 14))

                                        VStack(alignment: .leading, spacing: 2) {
                                            if let best = pr.bestSet {
                                                Text("\(best.reps ?? 0) reps @ \(String(format: "%.0f", best.weight ?? 0)) \(best.unit ?? "lb")")
                                                    .font(Theme.Fonts.titleSmall)
                                                    .foregroundStyle(Theme.Colors.onSurface)
                                            }
                                            Text(pr.date)
                                                .font(Theme.Fonts.labelSmall)
                                                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                        }
                                        Spacer()
                                    }
                                    .padding(12)
                                    .cardStyle()
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("\(exercise.name) Progress")
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.load(exerciseId: exercise.id) }
    }
}

struct ChartCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(Theme.Fonts.titleSmall)
                .foregroundStyle(Theme.Colors.onSurface)
            content
        }
        .padding(16)
        .cardStyle()
    }
}
