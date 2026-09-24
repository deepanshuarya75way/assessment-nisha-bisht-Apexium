import tensorflow as tf
from tensorflow.keras import layers, models

def build_cnn(input_shape=(128, 128, 1)):
    model = models.Sequential([
        # First conv block: learns simple patterns (edges, textures)
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.MaxPooling2D((2, 2)),

        # Second conv block: learns more complex patterns
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),

        # Third conv block: even more complex patterns
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),

        # Flatten the learned features into a single list
        layers.Flatten(),

        # Dense (fully connected) layer to combine everything learned
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),  # randomly turns off neurons during training to prevent overfitting

        # Output layer: single number between 0 and 1 (probability of "oil")
        layers.Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Recall(name='recall'), tf.keras.metrics.Precision(name='precision')]
    )

    return model

if __name__ == "__main__":
    model = build_cnn()
    model.summary()