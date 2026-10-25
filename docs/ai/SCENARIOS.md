# Izvršeni AI scenariji Koraka 8

Datum 2026-10-06. Sintetički profil/program/izvori, fake provider, **nula mrežnih/plaćenih API poziva**. Ovo nije dokaz kvaliteta stvarnog modela. Reprodukcija: `npm run ai:demo -- --markdown`. [Ugovor](AI_CONTRACT.md), [dokazi](VERIFICATION.md).

| Scenario             | Očekivano / izvršeno                            | Greška              | Provider pokušaji |
| -------------------- | ----------------------------------------------- | ------------------- | ----------------- |
| AI-RECOMMENDATIONS   | recommendations / recommendations               | —                   | 1                 |
| AI-QUESTION          | question / question                             | —                   | 1                 |
| AI-PROPOSAL          | answer / answer                                 | —                   | 1                 |
| AI-PERMISSION        | alternative_permission / alternative_permission | —                   | 1                 |
| AI-UNKNOWN           | needs_verification / needs_verification         | —                   | 1                 |
| AI-OUT-OF-SCOPE      | out_of_scope / out_of_scope                     | —                   | 0                 |
| AI-INJECTION         | error / error                                   | UNSAFE_REQUEST      | 0                 |
| AI-INVENTED-DEADLINE | error / error                                   | INVALID_OUTPUT      | 1                 |
| AI-BAD-JSON          | error / error                                   | INVALID_OUTPUT      | 1                 |
| AI-REFUSAL           | error / error                                   | MODEL_REFUSAL       | 1                 |
| AI-INCOMPLETE        | error / error                                   | INCOMPLETE_RESPONSE | 1                 |
| AI-RATE-LIMIT        | error / error                                   | RATE_LIMIT          | 1                 |
| AI-TIMEOUT           | error / error                                   | TIMEOUT             | 1                 |
| AI-DOCUMENT-DISABLED | error / error                                   | DOCUMENT_DISABLED   | 0                 |

## AI-RECOMMENDATIONS

```json
{
  "type": "recommendations",
  "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed.",
  "proposals": [],
  "questions": [],
  "matching": {
    "mode": "synthetic",
    "schemaVersion": 1,
    "profileRevision": 13,
    "catalogVersion": "synthetic-1.0.0",
    "status": "options_found",
    "options": [
      {
        "programId": "synthetic-cs-a",
        "intakeId": "synthetic-cs-a-2027",
        "name": "Synthetic computing programme synthetic-cs-a",
        "institution": "Fictional Test Institution",
        "country": "DE",
        "city": "Fictional city",
        "kind": "verified_constraints",
        "reasons": [
          {
            "code": "level-matches",
            "category": "level",
            "message": "The catalog level matches your requested level.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "subject-matches",
            "category": "interest",
            "message": "The controlled editorial subject mapping matches your requested field; it is not an admissions assessment.",
            "factIds": [],
            "sourceIds": []
          },
          {
            "code": "country-check",
            "category": "location",
            "message": "The country is on your preferred list.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "teaching-language-check",
            "category": "language",
            "message": "A verified teaching language matches your list.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "budget-within-limit",
            "category": "finance",
            "message": "The recorded cost is within the stated budget in comparable units and coverage. This does not confirm all future charges.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          }
        ],
        "checks": [
          {
            "ruleId": "synthetic-deadline",
            "label": "Application deadline date: 2027-05-01.",
            "status": "met",
            "mandatory": true,
            "message": "The verified deadline has not passed; check the exact closing time before applying.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          }
        ],
        "warnings": [],
        "deviations": [],
        "nextStep": "Check the cited official conditions, applicant category and current intake before relying on this option. Admission and funding are not guaranteed."
      }
    ],
    "permissionRequests": [],
    "rejections": [],
    "gaps": [
      "Optional or unresolved profile detail: interests.",
      "Optional or unresolved profile detail: excludedCountries.",
      "Optional or unresolved profile detail: relevantSubjects.",
      "Optional or unresolved profile detail: languageResults.",
      "Optional or unresolved profile detail: professionalExperience.",
      "Optional or unresolved profile detail: researchExperience.",
      "Optional or unresolved profile detail: orientation.",
      "Optional or unresolved profile detail: flexiblePreferences.",
      "Unknown profile detail: previousQualification.institution.",
      "Unknown profile detail: previousQualification.credits."
    ],
    "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed."
  },
  "error": null,
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-QUESTION

```json
{
  "type": "question",
  "message": "Which level are you looking for: a bachelor's, master's or PhD?",
  "proposals": [],
  "questions": [
    {
      "id": "ask-studyLevel",
      "field": "studyLevel",
      "text": "Which level are you looking for: a bachelor's, master's or PhD?"
    }
  ],
  "matching": null,
  "error": null,
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-PROPOSAL

```json
{
  "type": "answer",
  "message": "Suggested profile changes need your confirmation. You can correct or reject them; your existing confirmed answers remain active until you approve a change.",
  "proposals": [
    {
      "id": "ai-synthetic-ai-request-0",
      "field": "budgetAmount",
      "value": 9000,
      "status": "extracted_unconfirmed",
      "baseRevision": 13,
      "evidence": "9000"
    }
  ],
  "questions": [],
  "matching": null,
  "error": null,
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-PERMISSION

```json
{
  "type": "alternative_permission",
  "message": "No normal option is available under the current constraints. Review the specific deviations before choosing whether to view an alternative.",
  "proposals": [],
  "questions": [],
  "matching": {
    "mode": "synthetic",
    "schemaVersion": 1,
    "profileRevision": 13,
    "catalogVersion": "synthetic-1.0.0",
    "status": "permission_required",
    "options": [],
    "permissionRequests": [
      {
        "requestId": "alternative-1",
        "profileRevision": 13,
        "deviations": [
          {
            "code": "country",
            "hard": true,
            "message": "This option is in IT, outside your preferred countries."
          }
        ],
        "message": "There is a subject-relevant option that differs from your requirements or preferences. Would you like to view it with these warnings?"
      }
    ],
    "rejections": [],
    "gaps": [
      "Optional or unresolved profile detail: interests.",
      "Optional or unresolved profile detail: excludedCountries.",
      "Optional or unresolved profile detail: relevantSubjects.",
      "Optional or unresolved profile detail: languageResults.",
      "Optional or unresolved profile detail: professionalExperience.",
      "Optional or unresolved profile detail: researchExperience.",
      "Optional or unresolved profile detail: orientation.",
      "Optional or unresolved profile detail: flexiblePreferences.",
      "Unknown profile detail: previousQualification.institution.",
      "Unknown profile detail: previousQualification.credits."
    ],
    "message": "No normal option is available under the current constraints. Review the specific deviations before choosing whether to view an alternative."
  },
  "error": null,
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-UNKNOWN

```json
{
  "type": "needs_verification",
  "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed.",
  "proposals": [],
  "questions": [],
  "matching": {
    "mode": "synthetic",
    "schemaVersion": 1,
    "profileRevision": 13,
    "catalogVersion": "synthetic-1.0.0",
    "status": "needs_verification",
    "options": [
      {
        "programId": "synthetic-cs-a",
        "intakeId": "synthetic-cs-a-2027",
        "name": "Synthetic computing programme synthetic-cs-a",
        "institution": "Fictional Test Institution",
        "country": "DE",
        "city": "Fictional city",
        "kind": "needs_verification",
        "reasons": [
          {
            "code": "level-matches",
            "category": "level",
            "message": "The catalog level matches your requested level.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "subject-matches",
            "category": "interest",
            "message": "The controlled editorial subject mapping matches your requested field; it is not an admissions assessment.",
            "factIds": [],
            "sourceIds": []
          },
          {
            "code": "country-check",
            "category": "location",
            "message": "The country is on your preferred list.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "teaching-language-check",
            "category": "language",
            "message": "A verified teaching language matches your list.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "budget-within-limit",
            "category": "finance",
            "message": "The recorded cost is within the stated budget in comparable units and coverage. This does not confirm all future charges.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          },
          {
            "code": "requirements-inventory-unknown",
            "category": "source",
            "message": "No complete institutional requirement inventory is available; this does not mean there are no requirements.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          }
        ],
        "checks": [
          {
            "ruleId": "synthetic-deadline",
            "label": "Application deadline date: 2027-05-01.",
            "status": "met",
            "mandatory": true,
            "message": "The verified deadline has not passed; check the exact closing time before applying.",
            "factIds": ["synthetic-fact"],
            "sourceIds": ["synthetic-source"]
          }
        ],
        "warnings": [
          "No complete institutional requirement inventory is available; this does not mean there are no requirements."
        ],
        "deviations": [],
        "nextStep": "Check the cited official conditions, applicant category and current intake before relying on this option. Admission and funding are not guaranteed."
      }
    ],
    "permissionRequests": [],
    "rejections": [],
    "gaps": [
      "Optional or unresolved profile detail: interests.",
      "Optional or unresolved profile detail: excludedCountries.",
      "Optional or unresolved profile detail: relevantSubjects.",
      "Optional or unresolved profile detail: languageResults.",
      "Optional or unresolved profile detail: professionalExperience.",
      "Optional or unresolved profile detail: researchExperience.",
      "Optional or unresolved profile detail: orientation.",
      "Optional or unresolved profile detail: flexiblePreferences.",
      "Unknown profile detail: previousQualification.institution.",
      "Unknown profile detail: previousQualification.credits.",
      "No complete institutional requirement inventory is available; this does not mean there are no requirements."
    ],
    "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed."
  },
  "error": null,
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-OUT-OF-SCOPE

```json
{
  "type": "out_of_scope",
  "message": "This app helps with study choices and application preparation. I can help with programmes, requirements, costs and documents related to that process.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": null,
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": [],
    "provider": "local",
    "requestedModel": null,
    "returnedModel": null,
    "providerVersion": "local-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 0,
    "usage": null,
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-INJECTION

```json
{
  "type": "error",
  "message": "I cannot follow instructions to bypass safeguards or disclose private data. Ask about study choices or applications.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "UNSAFE_REQUEST",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": [],
    "provider": "local",
    "requestedModel": null,
    "returnedModel": null,
    "providerVersion": "local-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 0,
    "usage": null,
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-INVENTED-DEADLINE

```json
{
  "type": "error",
  "message": "The AI response could not be verified. No suggested changes were applied.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "INVALID_OUTPUT",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-BAD-JSON

```json
{
  "type": "error",
  "message": "The AI response could not be verified. No suggested changes were applied.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "INVALID_OUTPUT",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-REFUSAL

```json
{
  "type": "error",
  "message": "The AI service could not answer this request. Try a question about study choices or applications.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "MODEL_REFUSAL",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-INCOMPLETE

```json
{
  "type": "error",
  "message": "The AI response was incomplete. No suggested changes were applied.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "INCOMPLETE_RESPONSE",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": ["req_synthetic"],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": "fake-education-1",
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": {
      "inputTokens": 100,
      "cachedInputTokens": 10,
      "outputTokens": 50
    },
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-RATE-LIMIT

```json
{
  "type": "error",
  "message": "The AI service is busy. Please try again later.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "RATE_LIMIT",
    "retryable": true
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": [],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": null,
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": null,
    "usageComplete": false,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-TIMEOUT

```json
{
  "type": "error",
  "message": "The AI request timed out. Your profile has not been changed.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "TIMEOUT",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": [],
    "provider": "mock",
    "requestedModel": "fake-education-1",
    "returnedModel": null,
    "providerVersion": "fake-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 1,
    "usage": null,
    "usageComplete": false,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```

## AI-DOCUMENT-DISABLED

```json
{
  "type": "error",
  "message": "Document analysis is disabled until its separate review is complete.",
  "proposals": [],
  "questions": [],
  "matching": null,
  "error": {
    "code": "DOCUMENT_DISABLED",
    "retryable": false
  },
  "metadata": {
    "requestId": "synthetic-ai-request",
    "providerRequestIds": [],
    "provider": "local",
    "requestedModel": null,
    "returnedModel": null,
    "providerVersion": "local-1",
    "instructionVersion": "education-instructions-1",
    "schemaVersion": "education-ai-1",
    "attempts": 0,
    "usage": null,
    "usageComplete": true,
    "estimatedCostUsd": 0,
    "pricingVersion": null
  }
}
```
