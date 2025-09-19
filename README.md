# JSON Toolkit

A comprehensive web application for working with JSON, CSV, and XML data. Built with React 19, TypeScript, and modern web technologies.

## 🚀 Features

### JSON Generator
- **Interactive JSON Creation**: Build complex JSON structures using an intuitive key-value interface
- **Nested Support**: Create unlimited depth objects and arrays
- **Drag & Drop**: Reorder fields with visual feedback
- **Real-time Validation**: Immediate feedback on JSON structure and syntax
- **Export Options**: Copy to clipboard or download as file

### JSON Validator  
- **Advanced Validation**: Comprehensive JSON syntax checking
- **Schema Support**: JSON Schema validation with built-in templates
- **Error Navigation**: Click-through error reporting with line numbers
- **Auto-fix**: Automatic correction of common JSON issues
- **Format Tools**: Beautify, minify, and format JSON

### CSV Converter
- **Smart Conversion**: Convert CSV to JSON with multiple output formats
- **Auto-detection**: Automatically detect delimiters and data types
- **Customizable Options**: Configure conversion settings and column selection
- **Preview Mode**: Review data before conversion

### XML Converter
- **XML to JSON**: Convert XML documents to JSON format
- **Attribute Handling**: Configurable attribute processing
- **Array Mode**: Smart array detection for repeated elements
- **Validation**: Built-in XML structure validation

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with dark mode support
- **Routing**: React Router DOM for navigation
- **State Management**: React Context API with reducer pattern
- **Validation**: AJV for JSON Schema validation
- **CSV Processing**: PapaParse for efficient CSV parsing
- **Testing**: Jest + Testing Library + Playwright

## 📚 Getting Started

Choose your preferred setup method:

### 🖥️ Local Development
For full development environment with hot reload and debugging.

**👉 [Local Setup Instructions](LOCAL-SETUP.md)**

### 🐳 Docker Setup
For containerized development and production environments.

**👉 [Docker Setup Instructions](DOCKER.md)**

### ☁️ Vercel Deployment
For deploying to production with automated CI/CD.

**👉 [Deployment Instructions](DEPLOYMENT.md)**

## ⌨️ Keyboard Shortcuts

### Global Navigation
- `Ctrl+1` - JSON Generator
- `Ctrl+2` - JSON Validator  
- `Ctrl+3` - CSV Converter
- `Ctrl+4` - XML Converter
- `Ctrl+,` - Open Settings

### General Actions
- `Ctrl+Shift+S` - Save/Download current output
- `Ctrl+Alt+C` - Copy output to clipboard
- `Ctrl+Shift+K` - Clear input/reset
- `Ctrl+Alt+H` - Show keyboard shortcuts help

### JSON Generator
- `Ctrl+Enter` - Add new field
- `Ctrl+D` - Toggle compact mode
- `Escape` - Collapse all fields

### JSON Validator
- `Ctrl+Shift+F` - Format JSON
- `Ctrl+Shift+V` - Validate JSON

### CSV Converter
- `Ctrl+Shift+C` - Convert CSV to JSON

## 🎨 Customization

Access the Settings modal (`Ctrl+,`) for:

- **Appearance**: Theme, contrast, animations
- **Layout**: Variants, orientation, spacing
- **Editor**: Formatting, tooltips, validation
- **Shortcuts**: View and customize keyboard shortcuts
- **Accessibility**: Screen reader support, high contrast mode

## 🧩 Architecture

### Component Structure
```
src/
├── components/
│   ├── common/          # Shared UI components
│   ├── json-generator/  # JSON creation tools
│   ├── json-validator/  # JSON validation tools
│   ├── csv-converter/   # CSV processing tools
│   └── xml-converter/   # XML processing tools
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript definitions
└── __tests__/           # Test files
```

### Key Features
- **Modular Design**: Feature-based organization
- **Type Safety**: Comprehensive TypeScript coverage
- **Performance**: Optimized rendering and data processing
- **Accessibility**: WCAG 2.1 AA compliant
- **Testing**: High test coverage with multiple testing strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Ensure accessibility compliance
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check the setup documentation for your platform
- Review the interactive tours within the application

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- Powered by Vite for fast development
- Styled with Tailwind CSS
- Tested with Jest, Testing Library, and Playwright
- Accessible design following WCAG guidelines

---

**JSON Toolkit** - Making JSON, CSV, and XML data processing simple and efficient.