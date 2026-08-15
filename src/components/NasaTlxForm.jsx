import React, {
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Slider,
  Stack,
  Typography,
} from "@mui/material";


const DIMENSIONS = [
  {
    key: "mentalDemand",

    label:
      "Mental Demand",

    description:
      "How mentally demanding was the task?",

    lowLabel:
      "Very Low",

    highLabel:
      "Very High",
  },

  {
    key: "physicalDemand",

    label:
      "Physical Demand",

    description:
      "How physically demanding was the task?",

    lowLabel:
      "Very Low",

    highLabel:
      "Very High",
  },

  {
    key: "temporalDemand",

    label:
      "Temporal Demand",

    description:
      "How hurried or rushed was the pace of the task?",

    lowLabel:
      "Very Low",

    highLabel:
      "Very High",
  },

  {
    key: "performance",

    label:
      "Performance",

    description:
      "How successful were you in accomplishing what you were asked to do?",

    lowLabel:
      "Perfect",

    highLabel:
      "Failure",
  },

  {
    key: "effort",

    label:
      "Effort",

    description:
      "How hard did you have to work to accomplish your level of performance?",

    lowLabel:
      "Very Low",

    highLabel:
      "Very High",
  },

  {
    key: "frustration",

    label:
      "Frustration",

    description:
      "How insecure, discouraged, irritated, stressed or annoyed were you?",

    lowLabel:
      "Very Low",

    highLabel:
      "Very High",
  },
];


function createInitialValues() {
  return DIMENSIONS.reduce(
    (result, dimension) => ({
      ...result,

      [dimension.key]:
        50,
    }),
    {}
  );
}


function createTouchedState() {
  return DIMENSIONS.reduce(
    (result, dimension) => ({
      ...result,

      [dimension.key]:
        false,
    }),
    {}
  );
}


export default function NasaTlxForm({
  onSubmit,
}) {
  const [
    scores,
    setScores,
  ] = useState(
    createInitialValues
  );

  const [
    touched,
    setTouched,
  ] = useState(
    createTouchedState
  );


  const allCompleted =
    useMemo(
      () =>
        DIMENSIONS.every(
          (dimension) =>
            touched[
              dimension.key
            ]
        ),
      [touched]
    );


  const rawScore =
    useMemo(() => {
      const values =
        Object.values(scores);

      const total =
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        );

      return (
        total /
        values.length
      ).toFixed(2);
    }, [scores]);


  const handleChange =
    (key, value) => {
      setScores(
        (previous) => ({
          ...previous,
          [key]: value,
        })
      );

      setTouched(
        (previous) => ({
          ...previous,
          [key]: true,
        })
      );
    };


  return (
    <Card
      elevation={0}
      sx={{
        border:
          "1px solid #e5e7eb",
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          sx={{ mb: 1 }}
        >
          NASA-TLX Workload Assessment
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Rate how you experienced
          the task you just completed.
          Please adjust every scale
          before submitting.
        </Typography>

        <Alert
          severity="info"
          sx={{ mb: 3 }}
        >
          Please answer based only
          on the task you have just
          completed.
        </Alert>

        <Stack spacing={4}>
          {DIMENSIONS.map(
            (dimension) => (
              <Box
                key={
                  dimension.key
                }
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {
                    dimension.label
                  }
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {
                    dimension.description
                  }
                </Typography>

                <Slider
                  value={
                    scores[
                      dimension.key
                    ]
                  }

                  onChange={(
                    _event,
                    value
                  ) =>
                    handleChange(
                      dimension.key,
                      value
                    )
                  }

                  min={0}
                  max={100}
                  step={5}

                  valueLabelDisplay="on"

                  marks={[
                    {
                      value: 0,
                      label:
                        dimension
                          .lowLabel,
                    },

                    {
                      value: 100,
                      label:
                        dimension
                          .highLabel,
                    },
                  ]}

                  aria-label={
                    dimension.label
                  }
                />

                {!touched[
                  dimension.key
                ] && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                  >
                    Please adjust this
                    rating.
                  </Typography>
                )}
              </Box>
            )
          )}
        </Stack>

        <Box
          sx={{
            mt: 4,
            p: 2,

            bgcolor:
              "#f8fafc",

            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Raw NASA-TLX
          </Typography>

          <Typography
            variant="h5"
          >
            {rawScore}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"

          disabled={
            !allCompleted
          }

          sx={{ mt: 3 }}

          onClick={() =>
            onSubmit(scores)
          }
        >
          Submit Workload Assessment
        </Button>
      </CardContent>
    </Card>
  );
}