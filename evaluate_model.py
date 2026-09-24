import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

# Load test data
X_test = np.load("X_test.npy")
y_test = np.load("y_test.npy")

# Preprocess exactly like training data
X_test = X_test.astype("float32") / 255.0
X_test = np.expand_dims(X_test, axis=-1)

# Load the trained model
model = tf.keras.models.load_model("oil_spill_model.h5")

# Get predictions (probabilities between 0 and 1)
y_pred_probs = model.predict(X_test)

# Convert probabilities to 0/1 using 0.5 as the cutoff
y_pred = (y_pred_probs > 0.5).astype(int).flatten()

# Print detailed results
print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["No Oil (0)", "Oil (1)"]))

print("=== Confusion Matrix ===")
print(confusion_matrix(y_test, y_pred))