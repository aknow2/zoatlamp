const uint8_t PIN_CLK = 8;
const uint8_t PIN_DT = 12;
const uint8_t PIN_SW = A0;

const uint8_t PIN_MOTOR_PWM = 9;
const uint8_t PIN_LED_PWM = 10;

const bool DEBUG = false;

const unsigned long DEBOUNCE_DELAY_MS = 30;
const unsigned long BUTTON_LONG_PRESS_MS = 2000;
const unsigned long BLINK_CYCLE_MS = 50;
const unsigned long BLINK_ON_MS = 5;

const uint16_t PWM_PERMILLE_MIN = 0;
const uint16_t PWM_PERMILLE_MAX = 600;
const uint16_t PWM_PER_CLICK_PERMILLE = 1;
const uint16_t PWM_FAST_RISE_PER_CLICK_PERMILLE = 200;
const uint16_t PWM_RAMP_THRESHOLD_PERMILLE = 60;
const uint16_t MOTOR_INITIAL_PWM_PERMILLE = 0;

enum LightMode {
  LIGHT_MODE_OFF = 0,
  LIGHT_MODE_ON,
  LIGHT_MODE_BLINK,
};

LightMode currentLightMode = LIGHT_MODE_OFF;

uint16_t motorPwmPermille = MOTOR_INITIAL_PWM_PERMILLE;

int lastClkState = HIGH;
int lastButtonReading = HIGH;
int stableButtonState = HIGH;

unsigned long lastButtonChangeTime = 0;
unsigned long buttonPressedTime = 0;
bool longPressHandled = false;

void initializePins();
void initializeSerial();
void updateInputState(unsigned long now);
void handleButton(unsigned long now);
void handleEncoder();
void applyShortButtonTransition();
void setLightMode(LightMode nextMode);
LightMode getNextLightMode(LightMode mode);
void adjustMotorPwmByClick(int8_t direction);
void enforceOffModeConstraints();
void updateOutputs(unsigned long now);
void updateMotorOutput();
void updateLedOutput(unsigned long now);
uint8_t convertPermilleToPwm(uint16_t permille);
const char* getLightModeName(LightMode mode);
void logMotorPwm();

// Initializes hardware and starts the controller in the OFF mode.
void setup() {
  initializeSerial();
  initializePins();

  lastClkState = digitalRead(PIN_CLK);
  lastButtonReading = digitalRead(PIN_SW);
  stableButtonState = lastButtonReading;
  if (stableButtonState == LOW) {
    buttonPressedTime = millis();
  }

  setLightMode(LIGHT_MODE_OFF);
  updateOutputs(millis());

  if (DEBUG) {
    Serial.println("Motor and light controller start");
  }
}

// Runs input handling and output updates without blocking.
void loop() {
  unsigned long now = millis();

  updateInputState(now);
  updateOutputs(now);
}

// Configures encoder inputs, button input, and PWM outputs.
void initializePins() {
  pinMode(PIN_CLK, INPUT_PULLUP);
  pinMode(PIN_DT, INPUT_PULLUP);
  pinMode(PIN_SW, INPUT_PULLUP);
  pinMode(PIN_MOTOR_PWM, OUTPUT);
  pinMode(PIN_LED_PWM, OUTPUT);
}

// Starts serial output only when debug logging is enabled.
void initializeSerial() {
  if (DEBUG) {
    Serial.begin(9600);
  }
}

// Polls all user inputs for the current loop iteration.
void updateInputState(unsigned long now) {
  handleButton(now);
  handleEncoder();
}

// Debounces the button and distinguishes short presses from long presses.
void handleButton(unsigned long now) {
  int buttonReading = digitalRead(PIN_SW);

  if (buttonReading != lastButtonReading) {
    lastButtonChangeTime = now;
    lastButtonReading = buttonReading;
  }

  if ((now - lastButtonChangeTime) < DEBOUNCE_DELAY_MS) {
    return;
  }

  if (buttonReading != stableButtonState) {
    stableButtonState = buttonReading;

    if (stableButtonState == LOW) {
      buttonPressedTime = now;
      longPressHandled = false;
    } else if (!longPressHandled) {
      applyShortButtonTransition();
    }
  }

  if (stableButtonState == LOW && !longPressHandled &&
      (now - buttonPressedTime) >= BUTTON_LONG_PRESS_MS) {
    setLightMode(LIGHT_MODE_OFF);
    longPressHandled = true;
  }
}

// Reads rotary encoder movement and applies motor speed changes when allowed.
void handleEncoder() {
  int clkState = digitalRead(PIN_CLK);

  if (clkState == lastClkState) {
    return;
  }

  lastClkState = clkState;

  // Handle only the falling edge of CLK so each detent updates once.
  if (clkState != LOW) {
    return;
  }

  if (currentLightMode == LIGHT_MODE_OFF) {
    return;
  }

  int8_t direction = (digitalRead(PIN_DT) != clkState) ? 1 : -1;
  adjustMotorPwmByClick(direction);
}

// Advances the light mode for a completed short button press.
void applyShortButtonTransition() {
  LightMode nextMode = getNextLightMode(currentLightMode);
  setLightMode(nextMode);
}

// Applies a light mode and enforces any constraints attached to it.
void setLightMode(LightMode nextMode) {
  currentLightMode = nextMode;

  if (currentLightMode == LIGHT_MODE_OFF) {
    enforceOffModeConstraints();
  }

  if (DEBUG) {
    Serial.print("Light mode: ");
    Serial.println(getLightModeName(currentLightMode));
  }
}

// Returns the next mode for short-press transitions.
LightMode getNextLightMode(LightMode mode) {
  if (mode == LIGHT_MODE_OFF) {
    return LIGHT_MODE_ON;
  }

  if (mode == LIGHT_MODE_ON) {
    return LIGHT_MODE_BLINK;
  }

  return LIGHT_MODE_ON;
}

// Changes the stored motor PWM value by one encoder click.
void adjustMotorPwmByClick(int8_t direction) {
  uint16_t previousMotorPwmPermille = motorPwmPermille;

  if (direction > 0) {
    uint16_t incrementPermille = (motorPwmPermille < PWM_RAMP_THRESHOLD_PERMILLE)
        ? PWM_FAST_RISE_PER_CLICK_PERMILLE
        : PWM_PER_CLICK_PERMILLE;

    if (motorPwmPermille <= (PWM_PERMILLE_MAX - incrementPermille)) {
      motorPwmPermille += incrementPermille;
    } else {
      motorPwmPermille = PWM_PERMILLE_MAX;
    }
  } else {
    if (motorPwmPermille >= PWM_PER_CLICK_PERMILLE) {
      motorPwmPermille -= PWM_PER_CLICK_PERMILLE;
    } else {
      motorPwmPermille = PWM_PERMILLE_MIN;
    }
  }

  if (motorPwmPermille != previousMotorPwmPermille) {
    logMotorPwm();
  }
}

// Forces all state that must be reset while the light is OFF.
void enforceOffModeConstraints() {
  motorPwmPermille = PWM_PERMILLE_MIN;
}

// Applies the current state to motor and LED outputs.
void updateOutputs(unsigned long now) {
  if (currentLightMode == LIGHT_MODE_OFF) {
    enforceOffModeConstraints();
  }

  updateMotorOutput();
  updateLedOutput(now);
}

// Writes the motor PWM output, forcing zero while the light is OFF.
void updateMotorOutput() {
  uint16_t outputPermille = motorPwmPermille;

  if (currentLightMode == LIGHT_MODE_OFF) {
    outputPermille = PWM_PERMILLE_MIN;
  }

  analogWrite(PIN_MOTOR_PWM, convertPermilleToPwm(outputPermille));
}

// Writes the LED PWM output for OFF, ON, and BLINK modes.
void updateLedOutput(unsigned long now) {
  uint8_t ledPwm = 0;
  
  if (currentLightMode == LIGHT_MODE_ON) {
    ledPwm = 60;
  } else if (currentLightMode == LIGHT_MODE_BLINK) {
    unsigned long blinkPhaseMs = now % BLINK_CYCLE_MS;
    ledPwm = (blinkPhaseMs < BLINK_ON_MS) ? 108 : 0;
  }

  analogWrite(PIN_LED_PWM, ledPwm);
}

// Converts a 0-1000 permille value to Arduino's 0-255 PWM range.
uint8_t convertPermilleToPwm(uint16_t permille) {
  if (permille >= PWM_PERMILLE_MAX) {
    return 255;
  }

  return (uint32_t)(permille * 255UL + 500UL) / 1000UL;
}

// Returns a readable name for debug logging.
const char* getLightModeName(LightMode mode) {
  if (mode == LIGHT_MODE_OFF) {
    return "OFF";
  }

  if (mode == LIGHT_MODE_ON) {
    return "ON";
  }

  return "BLINK";
}

// Prints the current motor PWM percentage when debug logging is enabled.
void logMotorPwm() {
  if (!DEBUG) {
    return;
  }

  Serial.print("Motor PWM: ");
  Serial.print(motorPwmPermille / 10);
  Serial.print('.');
  Serial.print(motorPwmPermille % 10);
  Serial.println('%');
}
