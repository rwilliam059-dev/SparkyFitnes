# Suivi tapis — Laurence

## But

Adapter SparkyFitness à un suivi simple des séances de tapis de marche, avec saisie manuelle rapide sur mobile.

## Données souhaitées par séance

- Date
- Durée
- Distance
- Nombre de pas
- Vitesse moyenne
- Inclinaison
- Calories (facultatif)
- Douleur aux genoux sur une échelle de 0 à 10
- Craquements : aucun / faibles / moyens / importants
- Note libre facultative

## Expérience recherchée

La saisie doit pouvoir se faire immédiatement après une séance, sans devoir naviguer dans plusieurs écrans.

Exemple :

```text
Tapis de marche
Durée : 01:35
Distance : 6,1 km
Pas : 10 240
Vitesse : 3,8 km/h
Inclinaison : 4
Douleur genoux : 1/10
Craquements : faibles
```

## Suivi dans le temps

Les valeurs numériques doivent pouvoir être exploitées dans des graphiques ou rapports sur différentes périodes afin de suivre l'évolution.

## Stratégie

1. Tester d'abord SparkyFitness sans modification.
2. Identifier les champs réellement pénibles à saisir.
3. Ajouter uniquement les champs manquants utiles.
4. Garder les changements isolés pour faciliter les futures mises à jour du projet amont.

## Branche de travail

`feat/laurence-treadmill`
