import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  IconButton,
  CssBaseline,
  Paper,
  ThemeProvider,
  createTheme,
  Switch,
  Slider,
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

const API_TOKEN = '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';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});
const scrollableDivStyle = {
  maxHeight: '300px', // You can adjust the height as needed
  overflowY: 'auto',
};
const App = () => {
  const [text, setText] = useState('');
  const [summarizedText, setSummarizedText] = useState('');
  const [minLength, setMinLength] = useState(0);
  const [maxLength, setMaxLength] = useState(500);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [summarizedWordCount, setSummarizedWordCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState(null);
  const [cachedSummaries, setCachedSummaries] = useState({});
  const [cachedSummaryMessage, setCachedSummaryMessage] = useState('');

  useEffect(() => {
    const cachedSummariesJSON = localStorage.getItem('cachedSummaries');
    if (cachedSummariesJSON) {
      setCachedSummaries(JSON.parse(cachedSummariesJSON));
    }
  }, []);

  const handleMinLengthChange = (event, newValue) => {
    setMinLength(newValue);
  };

  const handleMaxLengthChange = (event, newValue) => {
    setMaxLength(newValue);
  };

  const handleTextChange = (e) => {
    const inputText = e.target.value;
    setText(inputText);
    const words = inputText.split(/\s+/).filter((word) => word !== '');
    setWordCount(words.length);

    if (words.length < 50 && words.length > 0) {
      setError('Input text must contain at least 50 words.');
    } else {
      setError(null);
    }
  };

  const handleClearSummarizedText = () => {
    setSummarizedText('');
    setSummarizedWordCount(0);
  };

  const handleCopySummarizedText = () => {
    navigator.clipboard.writeText(summarizedText);
  };

  const handleDownloadSummarizedText = () => {
    const blob = new Blob([summarizedText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summarized_text.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleSummarizeText = async () => {
    const cachedSummary = cachedSummaries[text];
    if (cachedSummary) {
      setSummarizedText(cachedSummary);
      const summarizedWords = cachedSummary.split(/\s+/).filter((word) => word !== '');
      setSummarizedWordCount(summarizedWords.length);
      setCachedSummaryMessage('This summary was retrieved from cache.');
      return;
    }

    if (wordCount < 50) {
      setError('Input text must contain at least 50 words.');
      return;
    }

    setLoading(true);
    setError(null);
    setCachedSummaryMessage('');

    try {
      const data = {
        inputs: text,
        parameters: {
          min_length: minLength, // Set min_length
          max_length: maxLength, // Set max_length
        },
      };

      const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.status === 200) {
        const result = await response.json();
        if (result && result.length > 0 && 'summary_text' in result[0]) {
          setSummarizedText(result[0].summary_text);
          const summarizedWords = result[0].summary_text.split(/\s+/).filter((word) => word !== '');
          setSummarizedWordCount(summarizedWords.length);

          setCachedSummaries({ ...cachedSummaries, [text]: result[0].summary_text });
          localStorage.setItem('cachedSummaries', JSON.stringify({ ...cachedSummaries, [text]: result[0].summary_text }));
        } else {
          setError('No summary found in the response.');
        }
      } else {
        setError(`Failed to summarize text. Status: ${response.status}`);
      }
    } catch (err) {
      setError('An error occurred while summarizing the text.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : createTheme()}>
      <CssBaseline />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={12} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                <CardContent style={{ flexGrow: 1 }}>
                  <Typography variant="h5" style={{ marginBottom: '20px' }}>Text before summarizing</Typography>
                  <TextField
                    multiline
                    rows={10}
                    fullWidth
                    placeholder="Enter text to summarize (minimum 50 words)"
                    value={text}
                    onChange={handleTextChange}
                  />
                  <br />
                  <Typography>Word Count: {wordCount}</Typography>
                  {error && <Typography variant="body1" style={{ color: 'red' }}>{error}</Typography>}
                </CardContent>
                <CardContent>
                  <Typography variant="h6" style={{ marginBottom: '10px' }}>Summary Length</Typography>
                  <div>Min</div>
                  <Slider
                    value={minLength}
                    min={0}
                    max={maxLength - 1 } 
                    onChange={handleMinLengthChange}
                    valueLabelDisplay="auto"
                  />
                  <div>Max</div>
                  <Slider
                    value={maxLength}
                    min={minLength + 1}
                    max={1000} // You can adjust the max value as needed
                    onChange={handleMaxLengthChange}
                    valueLabelDisplay="auto"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={12} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                <CardContent style={{ flexGrow: 1 }}>
                  <Typography variant="h5" style={{ marginBottom: '20px' }}>Text after summarizing</Typography>
                  {summarizedText && (
                    <>
                      {cachedSummaryMessage && <Typography variant="body2" style={{ color: 'green' }}>{cachedSummaryMessage}</Typography>}
                      <div style={scrollableDivStyle}>
                      <Typography variant="body1">{summarizedText}</Typography>
                      </div>
                      <br />
                      <Typography>Word Count (Summarized Text): {summarizedWordCount}</Typography>
                    </>
                  )}
                </CardContent>
                <CardContent style={{ textAlign: 'right', padding: '0' }}>
                  <IconButton onClick={handleClearSummarizedText}>
                    <DeleteIcon />
                  </IconButton>
                  <IconButton onClick={handleCopySummarizedText}>
                    <FileCopyIcon />
                  </IconButton>
                  <IconButton onClick={handleDownloadSummarizedText}>
                    <SaveIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSummarizeText}
                    disabled={loading}
                    style={{ marginTop: '20px' }}
                  >
                    Summarize
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Grid container justifyContent="flex-end" style={{ marginTop: '20px' }}>
            <Paper style={{ padding: '10px' }}>
              <Typography variant="subtitle1">Dark Mode</Typography>
              <Switch
                color="primary"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
            </Paper>
          </Grid>
        </Container>
      </div>
    </ThemeProvider>
  );
};

export default App;
