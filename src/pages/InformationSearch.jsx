import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { infoArticles } from "../data/demoData";

export default function InformationSearch({ adaptiveMode, cognitiveLoad }) {
  const [query, setQuery] = useState("");

  const highLoad = adaptiveMode && cognitiveLoad === "high";
  const mediumLoad = adaptiveMode && cognitiveLoad === "medium";
  const lowLoad = adaptiveMode && cognitiveLoad === "low";

  const filteredArticles = useMemo(() => {
    return infoArticles.filter((article) => {
      const searchText = `${article.title} ${article.category} ${article.summary}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }, [query]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Information Search
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Demonstrates content summarisation and focus support based on cognitive load.
      </Typography>

      {highLoad && (
        <Alert severity="info" sx={{ mb: 3 }}>
          High load adaptation applied: long descriptions are summarised and non-essential content is reduced.
        </Alert>
      )}

      {mediumLoad && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Medium load adaptation applied: categories and key content are highlighted.
        </Alert>
      )}

      {lowLoad && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Low load adaptation applied: full content and detailed reading mode are enabled.
        </Alert>
      )}

      <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search information"
            placeholder="Example: dashboard, task, cognitive load"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            helperText={
              highLoad
                ? "Search results will show simplified summaries."
                : "Search across research and system guidance content."
            }
          />

          <Divider sx={{ my: 3 }} />

          <List>
            {filteredArticles.map((article) => (
              <ListItem
                key={article.title}
                divider
                sx={{
                  alignItems: "flex-start",
                  bgcolor: mediumLoad ? "#fff7ed" : "transparent",
                  borderRadius: 2,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {article.title}
                      </Typography>

                      {!highLoad && <Chip size="small" label={article.category} />}
                    </Stack>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {highLoad ? article.summary : article.fullText}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>

          {lowLoad && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Detailed reading mode is enabled because cognitive load is low.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}