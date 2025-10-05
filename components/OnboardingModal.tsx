import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Clock, Target, CheckCircle } from 'lucide-react-native';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to TimeBlock!',
      subtitle: 'Track your time in 15-minute intervals',
      icon: <Clock size={64} color="#3b82f6" />,
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.description}>
            This app helps you understand how you spend your time by breaking each day into 96 fifteen-minute slots.
          </Text>
          <View style={styles.features}>
            <View style={styles.feature}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.featureText}>Track time in 15-minute intervals</Text>
            </View>
            <View style={styles.feature}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.featureText}>Create custom categories</Text>
            </View>
            <View style={styles.feature}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.featureText}>View detailed analytics</Text>
            </View>
            <View style={styles.feature}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.featureText}>Bulk time assignment</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'How It Works',
      subtitle: 'Simple time tracking',
      icon: <Target size={64} color="#10b981" />,
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.description}>
            Each day is divided into 96 time slots. Simply tap a slot to assign a category, or select multiple slots for bulk assignment.
          </Text>
          <View style={styles.howItWorks}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Tap time slots on the Timeline</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Choose a category (Work, Sleep, etc.)</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>View insights in Dashboard</Text>
            </View>
          </View>
        </View>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onComplete}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.iconContainer}>
              {currentStepData.icon}
            </View>

            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>

            {currentStepData.content}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.indicators}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentStep && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    position: 'relative',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  skipText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  stepContent: {
    width: '100%',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  howItWorks: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  activeIndicator: {
    backgroundColor: '#3b82f6',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});