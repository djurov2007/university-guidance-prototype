# Izvršeni matching scenariji — Korak 7

Datum 2026-10-06. Sintetički katalog/18+ profil su fiktivni, nema stvarnih programa ili institucionalnih pravila u tim primerima. Poslednji scenario čita stvarni **prazan published** katalog. Reprodukcija: `npm run matching:demo -- --markdown`. [Algoritam](ALGORITHM.md), [dokazi](VERIFICATION.md). Broj/status su stvarno izvršeni, nisu rezultati pilota.

| Scenario                  | Očekivano / izvršeno                      | Prikazane opcije | Zahtevi dozvole |
| ------------------------- | ----------------------------------------- | ---------------- | --------------- |
| ONE-OPTION                | options_found / options_found             | 1                | 0               |
| TWO-OPTIONS               | options_found / options_found             | 2                | 0               |
| WRONG-LEVEL               | no_match / no_match                       | 0                | 0               |
| WRONG-FIELD               | no_match / no_match                       | 0                | 0               |
| LANGUAGE-PERMISSION       | permission_required / permission_required | 0                | 1               |
| COUNTRY-BUDGET-BEFORE     | permission_required / permission_required | 0                | 1               |
| COUNTRY-BUDGET-AFTER      | needs_verification / needs_verification   | 1                | 0               |
| COUNTRY-BUDGET-REVOKED    | no_match / no_match                       | 0                | 0               |
| SCHOLARSHIP-CONDITIONAL   | permission_required / permission_required | 0                | 1               |
| UNKNOWN-INSTITUTION       | needs_verification / needs_verification   | 1                | 0               |
| KNOWN-INSTITUTION-FAILURE | no_match / no_match                       | 0                | 0               |
| SOURCE-CONFLICT           | needs_verification / needs_verification   | 1                | 0               |
| NO-PROGRAMS               | catalog_empty / catalog_empty             | 0                | 0               |
| ACTUAL-PUBLISHED-EMPTY    | catalog_empty / catalog_empty             | 0                | 0               |

## ONE-OPTION

Mode: synthetic.

```json
{
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
}
```

## TWO-OPTIONS

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "options_found",
  "options": [
    {
      "programId": "a",
      "intakeId": "a-2027",
      "name": "Synthetic computing programme a",
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
    },
    {
      "programId": "b",
      "intakeId": "b-2027",
      "name": "Synthetic computing programme b",
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
}
```

## WRONG-LEVEL

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "no_match",
  "options": [],
  "permissionRequests": [],
  "rejections": [
    {
      "code": "wrong_level",
      "count": 1,
      "message": "Some catalog programs were excluded because the study level differs."
    }
  ],
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
  "message": "No verified match was found in this catalog. This does not mean that no suitable program exists."
}
```

## WRONG-FIELD

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "no_match",
  "options": [],
  "permissionRequests": [],
  "rejections": [
    {
      "code": "wrong_field",
      "count": 1,
      "message": "Some catalog programs were excluded by the controlled subject mapping."
    }
  ],
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
  "message": "No verified match was found in this catalog. This does not mean that no suitable program exists."
}
```

## LANGUAGE-PERMISSION

Mode: synthetic.

```json
{
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
          "code": "language",
          "hard": true,
          "message": "The teaching language differs from your listed languages. Your permission does not waive an institution's language requirement."
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
}
```

## COUNTRY-BUDGET-BEFORE

Mode: synthetic.

```json
{
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
        },
        {
          "code": "budget",
          "hard": true,
          "message": "The verified cost or tuition lower bound exceeds your stated budget. Funding is not assumed."
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
    "Unknown profile detail: previousQualification.credits.",
    "A possible scholarship is not approved funding and is never deducted from the cost."
  ],
  "message": "No normal option is available under the current constraints. Review the specific deviations before choosing whether to view an alternative."
}
```

## COUNTRY-BUDGET-AFTER

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "needs_verification",
  "options": [
    {
      "programId": "synthetic-italy",
      "intakeId": "synthetic-italy-2027",
      "name": "Synthetic computing programme synthetic-italy",
      "institution": "Fictional Test Institution",
      "country": "IT",
      "city": "Fictional city",
      "kind": "conditional_alternative",
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
          "message": "The country differs from your preference; permission is required.",
          "factIds": ["synthetic-fact"],
          "sourceIds": ["synthetic-source"]
        },
        {
          "code": "teaching-language-check",
          "category": "language",
          "message": "A verified teaching language matches your list.",
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
        "A possible scholarship is not approved funding and is never deducted from the cost."
      ],
      "deviations": [
        {
          "code": "country",
          "hard": true,
          "message": "This option is in IT, outside your preferred countries."
        },
        {
          "code": "budget",
          "hard": true,
          "message": "The verified cost or tuition lower bound exceeds your stated budget. Funding is not assumed."
        }
      ],
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
    "A possible scholarship is not approved funding and is never deducted from the cost."
  ],
  "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed."
}
```

## COUNTRY-BUDGET-REVOKED

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "no_match",
  "options": [],
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
    "A possible scholarship is not approved funding and is never deducted from the cost."
  ],
  "message": "No verified match was found in this catalog. This does not mean that no suitable program exists."
}
```

## SCHOLARSHIP-CONDITIONAL

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 14,
  "catalogVersion": "synthetic-1.0.0",
  "status": "permission_required",
  "options": [],
  "permissionRequests": [
    {
      "requestId": "alternative-1",
      "profileRevision": 14,
      "deviations": [
        {
          "code": "scholarship",
          "hard": true,
          "message": "Funding or a scholarship is required but has not been awarded to you. This remains a conditional option."
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
    "Unknown profile detail: previousQualification.credits.",
    "A possible scholarship is not approved funding and is never deducted from the cost."
  ],
  "message": "No normal option is available under the current constraints. Review the specific deviations before choosing whether to view an alternative."
}
```

## UNKNOWN-INSTITUTION

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "needs_verification",
  "options": [
    {
      "programId": "manual",
      "intakeId": "manual-2027",
      "name": "Synthetic computing programme manual",
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
        }
      ],
      "checks": [
        {
          "ruleId": "manual-rule",
          "label": "Recognition needs review",
          "status": "unknown",
          "mandatory": true,
          "message": "The available information cannot establish this institutional condition.",
          "factIds": ["synthetic-fact"],
          "sourceIds": ["synthetic-source"]
        }
      ],
      "warnings": [
        "The available information cannot establish this institutional condition."
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
    "The available information cannot establish this institutional condition."
  ],
  "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed."
}
```

## KNOWN-INSTITUTION-FAILURE

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "no_match",
  "options": [],
  "permissionRequests": [],
  "rejections": [
    {
      "code": "institution_not_met",
      "count": 1,
      "message": "Some catalog programs were excluded by a known unmet mandatory institutional condition. User permission cannot waive it."
    }
  ],
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
  "message": "No verified match was found in this catalog. This does not mean that no suitable program exists."
}
```

## SOURCE-CONFLICT

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "needs_verification",
  "options": [
    {
      "programId": "conflict",
      "intakeId": "conflict-2027",
      "name": "Synthetic computing programme conflict",
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
        }
      ],
      "checks": [
        {
          "ruleId": "qualification-rule",
          "label": "Accepted previous qualification: secondary.",
          "status": "source_conflict",
          "mandatory": true,
          "message": "This institutional condition requires source or applicant verification.",
          "factIds": ["synthetic-fact"],
          "sourceIds": ["synthetic-source"]
        }
      ],
      "warnings": [
        "This institutional condition requires source or applicant verification."
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
    "This institutional condition requires source or applicant verification."
  ],
  "message": "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed."
}
```

## NO-PROGRAMS

Mode: synthetic.

```json
{
  "mode": "synthetic",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "synthetic-1.0.0",
  "status": "catalog_empty",
  "options": [],
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
  "message": "The published catalog has no programs. This is a coverage gap, not a finding that you are ineligible."
}
```

## ACTUAL-PUBLISHED-EMPTY

Mode: published.

```json
{
  "mode": "published",
  "schemaVersion": 1,
  "profileRevision": 13,
  "catalogVersion": "1.0.0",
  "status": "catalog_empty",
  "options": [],
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
  "message": "The published catalog has no programs. This is a coverage gap, not a finding that you are ineligible."
}
```
