import SwiftUI

struct SetLogRowView: View {
    @Binding var setLog: EditableSetLog
    let isStrength: Bool
    let onChanged: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            // Set number
            Text("\(setLog.setIndex + 1)")
                .font(Theme.Fonts.labelMedium)
                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                .frame(width: 32)

            if isStrength {
                // Reps
                TextField("0", text: $setLog.reps)
                    .keyboardType(.numberPad)
                    .textFieldStyle(CompactTextFieldStyle())
                    .frame(maxWidth: .infinity)
                    .onChange(of: setLog.reps) { onChanged() }

                // Weight
                TextField("0", text: $setLog.weight)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(CompactTextFieldStyle())
                    .frame(maxWidth: .infinity)
                    .onChange(of: setLog.weight) { onChanged() }
            } else {
                // Duration
                TextField("0", text: $setLog.durationSec)
                    .keyboardType(.numberPad)
                    .textFieldStyle(CompactTextFieldStyle())
                    .frame(maxWidth: .infinity)
                    .onChange(of: setLog.durationSec) { onChanged() }
            }

            // RPE
            TextField("", text: $setLog.rpe)
                .keyboardType(.numberPad)
                .textFieldStyle(CompactTextFieldStyle())
                .frame(width: 48)
                .onChange(of: setLog.rpe) { onChanged() }

            // Delete button
            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.Colors.outlineVariant)
            }
            .frame(width: 32)
        }
    }
}

struct CompactTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .multilineTextAlignment(.center)
            .padding(.horizontal, 6)
            .padding(.vertical, 8)
            .background(Theme.Colors.surfaceContainer)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .font(Theme.Fonts.bodyMedium)
    }
}
