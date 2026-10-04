// Curated copy for repositories, keyed by GitHub repo name. Live stats (language,
// last push, stars) come from the weekly sync and are merged in src/lib/live.ts.
//
// Only featured repos are shown. Add the GitHub topic `featured` to a repo to
// feature it without touching this file.

export interface CuratedProject {
  title: string;
  tagline: string;
  metric?: { value: string; label: string };
  highlights?: string[];
  stack?: string[];
  demo?: { label: string; url: string };
  note?: string;
}

/** Featured cards, in display order. */
export const featured: string[] = [
  'Drowsiness-Detection-System',
  'Sentence-Saliency-System',
  'Credit-Card-Fraud-Detection',
  'Feel-Tweets',
  'Yukta-23',
];

/** Forks that are really my own team work and should be shown. */
export const forkAllowlist: string[] = ['Sentence-Saliency-System'];

/** Never shown (e.g. the GitHub profile README repo). */
export const hidden: string[] = ['dheepaks33'];

export const curated: Record<string, CuratedProject> = {
  'Drowsiness-Detection-System': {
    title: 'Drowsiness Detection System',
    tagline: 'Real-time driver monitoring from a webcam feed, with IoT alerts.',
    metric: { value: '68', label: 'facial landmarks tracked per frame' },
    highlights: [
      'Detects drowsiness with OpenCV and dlib facial landmarks, computing the Eye Aspect Ratio across consecutive frames to tell drowsiness apart from normal blinks.',
      'Streams alerts to IBM Watson IoT and a Node-RED dashboard for remote monitoring, alongside an on-device audio alarm.',
    ],
    stack: ['Python', 'OpenCV', 'dlib', 'IBM Watson IoT', 'Node-RED'],
  },
  'Sentence-Saliency-System': {
    title: 'Sentence Saliency System',
    tagline: 'Sentence-level saliency classification with profanity masking.',
    metric: { value: '93%', label: 'test accuracy' },
    highlights: [
      'TF-IDF features into a voting ensemble of Logistic Regression and SVC, adopted after a standalone LR model gave biased predictions.',
      'NLTK-based preprocessing for profanity detection and masking, served as an interactive Gradio app.',
    ],
    stack: ['Python', 'scikit-learn', 'NLTK', 'Gradio'],
    demo: { label: 'Live demo', url: 'https://huggingface.co/spaces/srini047/saliency-profanity-detection' },
    note: 'Team of four',
  },
  'Credit-Card-Fraud-Detection': {
    title: 'Credit Card Fraud Detection',
    tagline: 'Fraud classification on a heavily imbalanced set of anonymized card transactions.',
    metric: { value: '4', label: 'classifiers benchmarked' },
    highlights: [
      'Balanced the classes with random undersampling and SMOTE oversampling, with t-SNE for dimensionality reduction and anomaly inspection.',
      'Compared Logistic Regression, KNN, SVC and Decision Trees under cross-validation, then LR against a neural network.',
    ],
    stack: ['Python', 'scikit-learn', 'Jupyter'],
  },
  'Feel-Tweets': {
    title: 'FeelTweets',
    tagline: 'Tweet sentiment analysis with a Naive Bayes classifier written from scratch.',
    metric: { value: '99.4%', label: 'accuracy on 2,000 held-out tweets' },
    highlights: [
      'Cleans tweets before training: strips retweet markers, links, tickers and hashtag symbols, then tokenizes, drops stop words and stems with Porter.',
      'Computes the log prior and per-word log likelihoods by hand from word frequencies over 8,000 labelled tweets, a 9,085-word vocabulary, with no ML library doing the fitting.',
    ],
    stack: ['Python', 'NLTK', 'NumPy'],
  },
  'Yukta-23': {
    title: 'Hands-on CNN Workshop',
    tagline: 'The notebook I taught from at the Yuktha 2023 machine learning workshop.',
    metric: { value: '100+', label: 'participants taught' },
    highlights: [
      'Builds a convolutional neural network in TensorFlow/Keras one step at a time (convolution, pooling, flattening, dense layers, sigmoid output) so participants see what each layer does.',
      'Covers the full loop: image augmentation with shear, zoom and flips, 25 epochs of training with validation, then a prediction on a single new image.',
    ],
    stack: ['Python', 'TensorFlow', 'Keras'],
    note: 'Workshop material',
  },

  // One-liners for repos that aren't featured, used if one gets the `featured` topic.
  'Auth-Platform': {
    title: 'Auth Platform',
    tagline: 'FastAPI authentication service with JWT, SQLAlchemy models and Alembic migrations, containerized with Docker.',
  },
  'NLP-with-Disaster-Tweets': {
    title: 'NLP with Disaster Tweets',
    tagline: 'Kaggle challenge: classifying whether a tweet is about a real disaster.',
  },
  'Snake-and-Ladder-Game': {
    title: 'Snake and Ladder',
    tagline: 'The classic board game with a Tkinter GUI.',
  },
  'Todo-using-CLI': {
    title: 'Todo CLI',
    tagline: 'Command-line to-do manager with priority levels.',
  },
  'LeetCode---Weekly-Contest-368': {
    title: 'LeetCode Weekly Contest 368',
    tagline: 'Contest solutions in Python.',
  },
  Portfolio: {
    title: 'Portfolio',
    tagline: 'This site. Astro, rebuilt every week by GitHub Actions.',
  },
};
