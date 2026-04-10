# YouTube Clone - Mini YouTube

A full-featured YouTube clone application with all core YouTube functionalities. Watch videos, explore channels, manage playlists, comment, and interact with content just like YouTube.

---

## ✨ Features

### 🎬 Video Features
- **Video Browsing** - Browse and search videos across multiple categories (Entertainment, Programming, Science, Sports, Cooking, Music, Travel, Fitness)
- **Video Player** - Full-screen embedded YouTube player with controls and autoplay
- **Video Metadata** - Title, description, channel info, view count, upload date, duration, likes/dislikes
- **Video Search** - Search videos by title and channel name
- **Video Categories** - Filter by category (All, Entertainment, Programming, Science, Sports, Cooking, Music, Travel, Fitness)
- **Video Recommendations** - Similar videos displayed in sidebar while watching
- **Trending Videos** - Separate trending tab showing most popular videos by category

### 📺 Channel System
- **Channel Pages** - View full channel information with subscriber count
- **Channel Browse** - See all channels and their content
- **Subscribe/Unsubscribe** - Follow channels and manage subscriptions
- **Channel Videos** - View all videos from a specific channel
- **Channel Information** - Channel description, subscriber count, video count

### 📝 Comments & Interactions
- **Video Comments** - Read and view all comments on videos
- **Add Comments** - Post comments on videos (requires authentication)
- **Comment Timestamps** - See when comments were posted
- **Comment Likes** - Like comments to show appreciation
- **User Verification** - Comments linked to authenticated users
- **Nested Comments** - Reply structure for comment threads
- **Comment Management** - Edit or delete your own comments

### ❤️ User Interactions
- **Like Videos** - Like videos and see like count
- **Dislike Videos** - Dislike videos for feedback
- **Share Videos** - Share video links with others
- **Save Videos** - Save videos for later viewing
- **Subscribe from Video** - Quick subscribe button on video pages

### 📋 Playlists
- **Create Playlists** - Create custom playlists to organize videos
- **Edit Playlists** - Rename and modify playlist details
- **Add to Playlist** - Add videos to your playlists
- **Remove from Playlist** - Remove unwanted videos
- **Delete Playlists** - Remove playlists you no longer want
- **Playlist Privacy** - Set playlists as public or private
- **View Playlists** - Browse all your saved playlists
- **Playlist Videos** - See all videos in a playlist

### 🕒 Watch History
- **Auto-Tracking** - Automatically track videos you've watched
- **View History** - See all videos you've watched in order
- **History Timeline** - Videos organized by when you watched them
- **Remove from History** - Delete specific videos from history
- **Clear All History** - Clear your entire watch history
- **Continue Watching** - Resume videos from where you left off
- **History Sidebar** - Quick access to recently watched videos

### 👤 User Profiles
- **User Registration** - Create account with email and password
- **User Login** - Secure login with JWT authentication
- **Profile Customization** - Set profile name and picture
- **User Settings** - Configure notifications, theme, privacy
- **Profile View** - View your profile information
- **Account Security** - Password hashing and secure token-based sessions

### 🎤 Search Features
- **Text Search** - Search by video title or channel name
- **Search Autocomplete** - Smart suggestions as you type
- **Search Results** - Display matching videos and channels
- **Search Filters** - Filter results by upload date
- **Voice Search** - Search using voice input (audio recognition)
- **Search History** - View your previous searches

### 🔔 User Features
- **Notifications Panel** - View all user notifications
- **Notification Types** - New uploads, comments, likes, subscriptions
- **Notification Settings** - Enable/disable notification types
- **Notification Badges** - Badge on icon showing unread count
- **Notification History** - Clear and manage notifications

### 🌙 Theme & Settings
- **Dark Mode** - Full dark theme for comfortable viewing
- **Light Mode** - Standard light theme
- **Theme Toggle** - Switch between themes instantly
- **Theme Persistence** - Remember your theme preference
- **Settings Panel** - Configure all user preferences
- **Language Support** - English language interface
- **Accessibility Options** - Better text contrast modes

### 📱 Responsive Design
- **Mobile Responsive** - Works perfectly on phones
- **Tablet Responsive** - Optimized for tablets
- **Desktop Optimized** - Full-featured desktop experience
- **Adaptive Sidebar** - Sidebar collapses on mobile
- **Touch-Friendly** - Large buttons for touch screens
- **Flexible Layout** - Grid adapts to screen size

### 🎬 Special Content Types
- **Shorts Feed** - TikTok-style vertical video viewer
- **Shorts Player** - Full-screen shorts with controls
- **Skip Shorts** - Quick navigation between short videos
- **Shorts Categories** - Browse shorts by category
- **Music Playlist** - Indian music collection (Bollywood, Hindi songs)
- **Music Player** - Dedicated music listening experience

### ⌨️ Navigation & Controls
- **Sidebar Navigation** - Easy access to all sections
- **Collapsible Sidebar** - Hide sidebar for more screen space
- **Hamburger Menu** - Mobile-friendly navigation toggle
- **Top Bar Navigation** - Quick access to main sections
- **Breadcrumb Navigation** - Know where you are in the app
- **Back Button** - Navigate back from video player
- **Home Button** - Quick return to homepage

### 🏠 Pages & Sections
- **Home** - Featured videos and recommendations
- **Explore** - Browse by category
- **Trending** - Most popular videos by category
- **Shorts** - Vertical video feed
- **Music** - Music playlist and player
- **Watch History** - All videos you've watched
- **Playlists** - Your saved playlists
- **Liked Videos** - Videos you've liked
- **Settings** - User preferences and configuration
- **Channel Pages** - Individual channel information
- **Studio** - Creator tools interface (stub)

### 🔐 Security Features
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt encryption (10 salt rounds)
- **Input Validation** - All inputs validated on server
- **XSS Protection** - Prevents script injection attacks
- **CORS Enabled** - Secure cross-origin requests
- **Rate Limiting** - Prevents brute-force attacks
- **Security Headers** - Helmet.js protection
- **Authorization** - Users can only access their own data
- **Encrypted Passwords** - Industry-standard encryption
- **Session Management** - Secure user sessions with tokens

### 📊 User Data Management
- **Profile Data** - Name, email, profile picture
- **Subscription List** - All your channel subscriptions
- **Playlist Data** - All your saved playlists
- **Watch History** - Complete viewing history
- **User Settings** - Notification and theme preferences
- **Liked Videos** - All videos you've liked
- **Comment History** - All comments you've made

### 🎯 Video Categories
- **Entertainment** - Movies, trailers, entertainment content
- **Programming** - Code tutorials, coding courses
- **Science** - Educational science content
- **Sports** - Sports clips and events
- **Cooking** - Recipe and cooking tutorials
- **Music** - Music videos and performances
- **Travel** - Travel vlogs and destinations
- **Fitness** - Workout and fitness videos

### 🎨 UI Components
- **Header Bar** - Logo, search, user menu, notifications
- **Video Thumbnail** - Preview image with duration overlay
- **Video Card** - Complete video metadata display
- **Channel Avatar** - Profile pictures with initials
- **Subscribe Button** - Interactive subscribe/unsubscribe
- **Like/Dislike Buttons** - Rate videos
- **Share Button** - Share video link
- **Save Button** - Quick save to playlist
- **Comment Input** - Text area for new comments
- **Loading Spinners** - Loading indicators
- **Error Messages** - User-friendly error display

### ⚡ Performance Features
- **Lazy Loading** - Load content as needed
- **Cached Data** - Browser caching for faster loads
- **Optimized Images** - Compressed thumbnails
- **Smooth Scrolling** - Smooth page transitions
- **Quick Navigation** - Fast page switching
- **Efficient Rendering** - Optimized DOM updates
- **Minimal Dependencies** - No heavy frameworks
- **Fast API Responses** - Quick backend responses

### 📈 Statistics & Analytics (Backend Ready)
- **View Count** - Total video views
- **Like/Dislike Count** - User engagement metrics
- **Comment Count** - Total comments per video
- **Upload Date** - When video was posted
- **Subscriber Count** - Channel subscribers
- **User Created Date** - Account creation timestamp

---

## 🎬 Video Collection

**Included Videos:**
- HTML & CSS Full Course
- JavaScript Tutorial
- React JS Guide
- Web Development Basics
- Programming Tutorials
- Fitness Content
- Music Playlists

**All videos are embeddable from YouTube with full playback controls**

---

## 📱 User Interface

**Completely responsive and modern:**
- Clean dark theme interface (like YouTube)
- Intuitive navigation
- Smooth animations
- Professional styling
- Mobile-friendly layout
- Accessibility features
- Fast load times

---

## 🔗 Integration Ready

- **YouTube Embed API** - Real YouTube videos
- **User API** - User management
- **Video API** - Video catalog
- **Comments API** - Comment system
- **Playlist API** - Playlist management
- **Channel API** - Channel information
- **History API** - Watch history
- **Music API** - Music catalog

---

## 💡 What You Can Do

✅ Watch videos (embedded from real YouTube)
✅ Search and discover content
✅ Create and manage accounts
✅ Like/dislike videos
✅ Comment on videos
✅ Create custom playlists
✅ Subscribe to channels
✅ Track watch history
✅ Switch between dark/light themes
✅ Explore by category
✅ Watch vertical shorts
✅ Listen to music
✅ Manage all settings

---

## 🚀 Features Ready for Production

- Fully functional user authentication
- Complete video management system
- Full comment system with authentication
- Playlist creation and management
- Watch history tracking
- Channel subscription system
- User profile management
- Search functionality
- Category filtering
- Responsive mobile design
- Dark/light theme support
- Security best practices

---

**Your own YouTube-like experience!** 🎥✨

All features working • No sign-up required for features • Full-screen video player • Professional interface
