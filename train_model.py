import numpy as np
import tensorflow as tf
from build_model import build_cnn

# Load your prepared data
X_train = np.load("X_train.npy")
y_train = np.load("y_train.npy")
X_val = np.load("X_val.npy")
y_val = np.load("y_val.npy")

# Normalize pixel values from 0-255 to 0-1 (helps the model train faster/better)
X_train = X_train.astype("float32") / 255.0
X_val = X_val.astype("float32") / 255.0

# Add a "channel" dimension: model expects (height, width, channels)
# Since these are grayscale, channels = 1
X_train = np.expand_dims(X_train, axis=-1)
X_val = np.expand_dims(X_val, axis=-1)

print("Training data shape:", X_train.shape)
print("Validation data shape:", X_val.shape)

# Load the class weights we computed earlier
class_weight_dict = np.load("class_weights.npy", allow_pickle=True).item()
print("Using class weights:", class_weight_dict)

# Build the model
model = build_cnn(input_shape=(128, 128, 1))

# Stop training early if validation performance stops improving (prevents wasted time/overfitting)
early_stop = tf.keras.callbacks.EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True
)

# Train!
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=30,
    batch_size=32,
    class_weight=class_weight_dict,
    callbacks=[early_stop]
)

# Save the trained model
model.save("oil_spill_model.h5")
print("\nModel saved as oil_spill_model.h5")