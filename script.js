// Biến toàn cục
let slidesData = [];
let currentSlideIndex = 0;
const slideViewer = document.getElementById("slide-viewer");
const currentSlideSpan = document.getElementById("current-slide");
const totalSlidesSpan = document.getElementById("total-slides");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("json-upload");
const fileNameDisplay = document.getElementById("file-name");
const jsonErrorDisplay = document.getElementById("json-error");
const noFileMessage = document.getElementById("no-file-message");
const slidesContainer = document.querySelector(".slides-container");
const slideListContainer = document.getElementById("slide-list");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const slideViewerContainer = document.querySelector(".slide-viewer-container");

let originalWidth = 990;
let originalHeight = 555;

// Variables for drag functionality
let isDragging = false;
let currentDraggedElement = null;
let offsetX, offsetY;

const prevBtn = document.getElementById("prev-slide");
const nextBtn = document.getElementById("next-slide");

if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentSlideIndex > 0) {
      displaySlide(currentSlideIndex - 1);
    } else {
      showToast("Đã là trang đầu tiên");
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentSlideIndex < slidesData.length - 1) {
      displaySlide(currentSlideIndex + 1);
    } else {
      showToast("Đã là trang cuối cùng");
    }
  });
}

// Sự kiện khi click nút upload
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

// Sự kiện khi chọn file
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    fileNameDisplay.textContent = file.name;
    noFileMessage.style.display = "none";
    jsonErrorDisplay.style.display = "none";

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        initialize(data);
      } catch (error) {
        showError("File JSON không hợp lệ: " + error.message);
        resetDisplay();
      }
    };
    reader.onerror = () => {
      showError("Lỗi khi đọc file");
      resetDisplay();
    };
    reader.readAsText(file);
  }
});

// Hiển thị lỗi
function showError(message) {
  jsonErrorDisplay.textContent = message;
  jsonErrorDisplay.style.display = "block";
  noFileMessage.style.display = "block";
}

// Reset hiển thị
function resetDisplay() {
  slideViewer.innerHTML = "";
  slidesContainer.style.display = "none";
  slideListContainer.innerHTML = "";
  slidesData = [];
  currentSlideIndex = 0;
}

// --- Hàm tạo Element trên Slide ---
function createElement(elementData, isThumbnail = false) {
  const element = document.createElement("div");
  element.classList.add("slide-element");
  element.style.left = `${elementData.left}px`;
  element.style.top = `${elementData.top}px`;
  element.style.width = `${elementData.width}px`;
  element.style.height = `${elementData.height}px`;
  element.style.transform = `rotate(${elementData.rotate || 0}deg)`;
  element.style.opacity =
    elementData.opacity !== undefined ? elementData.opacity : 1;

  switch (elementData.type) {
    case "text":
      element.classList.add("element-text");
      element.innerHTML = elementData.content;
      element.style.lineHeight = elementData.lineHeight;
      element.style.fontFamily = elementData.defaultFontName || "Arial";
      element.style.color = elementData.defaultColor || "#333";
      if (elementData.wordSpace) {
        element.style.wordSpacing = `${elementData.wordSpace}px`;
      }
      break;

    case "shape":
      element.classList.add("element-shape");
      const svgShape = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

      if (elementData.viewBox) {
        svgShape.setAttribute(
          "viewBox",
          `0 0 ${elementData.viewBox[0]} ${elementData.viewBox[1]}`
        );
        svgShape.setAttribute("preserveAspectRatio", "none");
      } else {
        svgShape.setAttribute(
          "viewBox",
          `0 0 ${elementData.width} ${elementData.height}`
        );
      }

      path.setAttribute("d", elementData.path);
      path.setAttribute("fill", elementData.fill || "transparent");

      if (elementData.flipV) {
        const vbWidth = elementData.viewBox
          ? elementData.viewBox[0]
          : elementData.width;
        const vbHeight = elementData.viewBox
          ? elementData.viewBox[1]
          : elementData.height;
        path.setAttribute(
          "transform",
          `scale(1, -1) translate(0, -${vbHeight})`
        );
      }

      svgShape.appendChild(path);
      element.appendChild(svgShape);
      break;

    case "line":
      element.classList.add("element-line");
      const startX = elementData.start[0];
      const startY = elementData.start[1];
      const endX = elementData.end[0];
      const endY = elementData.end[1];

      // Tính toán chiều dài và góc quay
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

      // Thiết lập kích thước và vị trí container
      element.style.left = `${elementData.left + startX - 10}px`;
      element.style.top = `${elementData.top + startY - 10}px`;
      element.style.width = `${length}px`;
      element.style.height = `${elementData.width || 2}px`; // Dùng độ dày làm chiều cao

      // Tạo SVG
      const svgLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svgLine.setAttribute(
        "viewBox",
        `0 0 ${length} ${elementData.width || 2}`
      );
      svgLine.style.width = "100%";
      svgLine.style.height = "100%";
      svgLine.style.overflow = "visible";

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", "0");
      line.setAttribute("y1", (elementData.width || 2) / 2); // Canh giữa theo chiều dọc
      line.setAttribute("x2", length);
      line.setAttribute("y2", (elementData.width || 2) / 2);
      line.setAttribute("stroke", elementData.color || "#000");
      line.setAttribute("stroke-width", elementData.width || 2);
      line.setAttribute("stroke-linecap", "round");

      if (elementData.style === "dashed") {
        line.setAttribute("stroke-dasharray", "5,5");
      }

      // Áp dụng góc quay
      element.style.transform = `rotate(${angle}deg)`;
      element.style.transformOrigin = "0% 50%";

      svgLine.appendChild(line);
      element.appendChild(svgLine);
      break;
    case "table":
      element.classList.add("element-table");
      element.style.cursor = "move";
      element.style.width = `${elementData.width}px`;
      element.style.height = `${elementData.height}px`;

      const table = document.createElement("table");
      table.style.tableLayout = "fixed";
      table.style.width = `${elementData.width}px`;
      table.style.height = `${elementData.height}px`;

      if (elementData.outline) {
        table.style.border = `${elementData.outline.width || 2}px ${
          elementData.outline.style || "solid"
        } ${elementData.outline.color || "#eeece1"}`;
        table.style.borderCollapse = "collapse";
      }

      const tbody = document.createElement("tbody");

      const colWidths = elementData.colWidths || [];
      const totalRelativeWidth = colWidths.reduce(
        (sum, width) => sum + width,
        0
      );
      const tableWidth = elementData.width;

      elementData.data.forEach((rowData, rowIndex) => {
        const row = document.createElement("tr");
        row.style.height = `${elementData.cellMinHeight || 32}px`;
        row.style.minHeight = `${elementData.cellMinHeight || 32}px`;
        row.style.margin = "0";
        row.style.padding = "0";

        // Create cells in the row
        rowData.forEach((cellData, colIndex) => {
          const cell = document.createElement("td");
          // Tạo div chứa nội dung
          const contentDiv = document.createElement("div");
          contentDiv.className = "table-cell-content";
          contentDiv.textContent = (cellData.text || "").trim();

          // Thiết lập style cơ bản cho contentDiv
          contentDiv.style.margin = "0";
          contentDiv.style.padding = "5px";
          contentDiv.style.minHeight = `${elementData.cellMinHeight || 32}px`;
          contentDiv.style.height = "100%";
          contentDiv.style.boxSizing = "border-box";
          contentDiv.style.whiteSpace = "normal";
          contentDiv.style.wordBreak = "break-word";
          contentDiv.style.overflow = "hidden";
          contentDiv.style.display = "flex";
          contentDiv.style.alignItems = "center";

          // Apply theme from JSON data to contentDiv instead of row
          if (elementData.theme) {
            const theme = elementData.theme;

            // Handle row header
            if (rowIndex === 0 && theme.rowHeader) {
              contentDiv.style.backgroundColor =
                theme.rowHeaderColor || theme.color || "white";
              contentDiv.style.color = theme.rowHeaderTextColor || "white";
              contentDiv.style.fontWeight = "bold";
              contentDiv.style.lineHeight = "1";
            }
            // Handle row footer
            else if (
              rowIndex === elementData.data.length - 1 &&
              theme.rowFooter
            ) {
              contentDiv.style.backgroundColor =
                theme.rowFooterColor || theme.color || "white";
              contentDiv.style.color = theme.rowFooterTextColor || "white";
              contentDiv.style.fontWeight = "bold";
            }
            // Handle regular rows
            else {
              const rowColor = theme.rowColors
                ? theme.rowColors[rowIndex % theme.rowColors.length] ||
                  theme.color
                : theme.color;

              if (rowColor) {
                contentDiv.style.backgroundColor =
                  rowIndex % 2 !== 0
                    ? hexToRgba(rowColor, 0.3)
                    : hexToRgba(rowColor, 0.1);
              }
            }
          }

          // Set column width if colWidths exists
          if (colWidths[colIndex] !== undefined) {
            const extraWidth = Math.max(2, colWidths[colIndex] * 0.01);
            const colWidth =
              (colWidths[colIndex] / totalRelativeWidth) * tableWidth +
              extraWidth;
            cell.style.width = `${colWidth}px`;
            cell.style.maxWidth = `${colWidth}px`;
            contentDiv.style.width = "100%";
          }

          // Handle style from cellData
          if (cellData.style) {
            // Font styling
            contentDiv.style.fontFamily = cellData.style.fontname || "Arial";
            contentDiv.style.color = cellData.style.color || "#333";
            contentDiv.style.fontSize = cellData.style.fontsize || "14px";
            contentDiv.style.fontWeight = cellData.style.bold
              ? "bold"
              : "normal";
            contentDiv.style.fontStyle =
              cellData.style.em || cellData.style.italic ? "italic" : "normal";

            // Text decoration (underline và strikethrough)
            let decorations = [];
            if (cellData.style.underline) decorations.push("underline");
            if (cellData.style.strikethrough) decorations.push("line-through");
            contentDiv.style.textDecoration = decorations.join(" ");

            // Text alignment
            switch (cellData.style.align) {
              case "right":
                contentDiv.style.justifyContent = "flex-end";
                contentDiv.style.textAlign = "right";
                break;
              case "center":
                contentDiv.style.justifyContent = "center";
                contentDiv.style.textAlign = "center";
                break;
              case "justify":
                contentDiv.style.justifyContent = "space-between";
                contentDiv.style.textAlign = "justify";
                break;
              default:
                contentDiv.style.justifyContent = "flex-start";
                contentDiv.style.textAlign = "left";
            }

            // Background color
            if (cellData.style.backcolor) {
              contentDiv.style.backgroundColor = cellData.style.backcolor;
              table.style.backgroundColor = "white";
            }
          }

          // Apply border to cell
          if (elementData.outline) {
            cell.style.border = `${elementData.outline.width || 1}px ${
              elementData.outline.style || "solid"
            } ${elementData.outline.color || "#eeece1"}`;
          }

          // Handle column header/footer
          if (elementData.theme) {
            const theme = elementData.theme;
            if (colIndex === 0 && theme.colHeader) {
              contentDiv.style.backgroundColor =
                theme.colHeaderColor || theme.color || "#5b9bd5";
              contentDiv.style.color = theme.colHeaderTextColor || "white";
              contentDiv.style.fontWeight = "bold";
            }
            if (colIndex === rowData.length - 1 && theme.colFooter) {
              if (!cellData.style || !cellData.style.backcolor) {
                contentDiv.style.backgroundColor =
                  theme.colFooterColor || theme.color || "#5b9bd5";
              }
              contentDiv.style.color = theme.colFooterTextColor || "white";
              contentDiv.style.fontWeight = "bold";
            }
          }

          // Thêm contentDiv vào td
          cell.appendChild(contentDiv);

          // Handle colspan and rowspan
          if (cellData.colspan > 1) {
            cell.colSpan = cellData.colspan;
          }
          if (cellData.rowspan > 1) {
            cell.rowSpan = cellData.rowspan;
          }

          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      element.appendChild(table);

      if (!isThumbnail) {
        element.addEventListener("mousedown", startDrag);
      }
      break;
  }
  return element;
}

// Drag and drop functions for tables
function startDrag(e) {
  // Only handle left mouse button
  if (e.button !== 0) return;

  // Only allow dragging of table elements
  if (!e.target.closest(".element-table")) return;

  // Prevent dragging in fullscreen mode
  if (isFullscreen()) return;

  isDragging = true;
  currentDraggedElement = e.target.closest(".element-table");

  // Calculate offset from mouse to element position
  const rect = currentDraggedElement.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  // Add move and end listeners
  document.addEventListener("mousemove", dragElement);
  document.addEventListener("mouseup", stopDrag);

  // Prevent text selection during drag
  e.preventDefault();
}

function dragElement(e) {
  if (!isDragging || !currentDraggedElement || isFullscreen()) return;

  // Calculate new position
  const newLeft =
    e.clientX - offsetX - slideViewer.getBoundingClientRect().left;
  const newTop = e.clientY - offsetY - slideViewer.getBoundingClientRect().top;

  // Update element position
  currentDraggedElement.style.left = `${newLeft}px`;
  currentDraggedElement.style.top = `${newTop}px`;
}

function stopDrag() {
  isDragging = false;
  currentDraggedElement = null;

  // Remove event listeners
  document.removeEventListener("mousemove", dragElement);
  document.removeEventListener("mouseup", stopDrag);
}

// --- Hàm màu chủ đề ---
function hexToRgba(hex, opacity) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// --- Hàm hiển thị Slide ---
function displaySlide(index) {
  if (index < 0 || index >= slidesData.length) return;

  currentSlideIndex = index;
  const slide = slidesData[index];

  slideViewer.innerHTML = "";

  // Đặt background
  if (slide.background) {
    if (slide.background.type === "solid") {
      slideViewer.style.backgroundColor = slide.background.color || "#ffffff";
      slideViewer.style.backgroundImage = "none";
    }
  } else {
    slideViewer.style.backgroundColor = "#ffffff";
  }

  document.querySelectorAll(".slide-thumbnail").forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });

  // Tạo và thêm các element
  if (slide.elements) {
    slide.elements.forEach((elementData) => {
      try {
        const elementDiv = createElement(elementData);
        slideViewer.appendChild(elementDiv);
      } catch (error) {
        console.error("Lỗi khi tạo phần tử:", error);
      }
    });
  }
}

// --- Hàm cập nhật tỷ lệ scale ---
let isFullscreenMode = false;

// Cập nhật hàm updateScale
function updateScale() {
  if (isFullscreen()) {
    const containerWidth = slideViewerContainer.clientWidth;
    const containerHeight = slideViewerContainer.clientHeight;

    // Tính toán tỷ lệ scale để lấp đầy màn hình
    const scaleX = containerWidth / originalWidth;
    const scaleY = containerHeight / originalHeight;
    const scale = Math.max(scaleX, scaleY); // Sử dụng Math.max để lấp đầy

    // Áp dụng transform scale
    slideViewer.style.transform = `scale(${scale})`;
    slideViewer.style.width = `${originalWidth}px`;
    slideViewer.style.height = `${originalHeight}px`;

    // Loại bỏ margin và padding
    slideViewer.style.margin = "0";
    slideViewer.style.padding = "0";

    // Đảm bảo container không có padding
    slideViewerContainer.style.padding = "0";

    // Thay đổi cursor thành none khi fullscreen
    slideViewer.style.cursor = "default";
    document.querySelectorAll(".element-table").forEach((table) => {
      table.style.cursor = "default";
    });
  } else {
    // Trở về trạng thái ban đầu khi thoát fullscreen
    slideViewer.style.transform = "none";
    slideViewer.style.width = "100%";
    slideViewer.style.height = "100%";
    slideViewer.style.cursor = "default";
    document.querySelectorAll(".element-table").forEach((table) => {
      table.style.cursor = "move";
    });
  } // Hiển thị/ẩn nút điều hướng theo chế độ fullscreen
  const navButtons = document.querySelectorAll(".nav-button, .tools-left");
  navButtons.forEach((btn) => {
    btn.style.display = isFullscreen() ? "flex" : "none";
  });
}

// Cập nhật hàm isFullscreen để sử dụng biến toàn cục
function isFullscreen() {
  return document.fullscreenElement || isFullscreenMode;
}

// Thêm sự kiện resize và fullscreenchange
document.addEventListener("fullscreenchange", () => {
  isFullscreenMode = document.fullscreenElement !== null;
  updateScale();
});

window.addEventListener("resize", () => {
  if (isFullscreen()) {
    updateScale();
  }
});

// Cập nhật phần xử lý nút fullscreen
fullscreenBtn.addEventListener("click", () => {
  if (!isFullscreen()) {
    slideViewerContainer
      .requestFullscreen()
      .then(() => {
        isFullscreenMode = true;
        updateScale();
      })
      .catch(console.error);
  } else {
    document.exitFullscreen();
  }
});

// --- Chuyển slide ở chế độ fullscreen ---
document.addEventListener("keydown", (event) => {
  if (event.key === "F5") {
    event.preventDefault(); // Ngăn reload
    if (!isFullscreen()) {
      slideViewerContainer
        .requestFullscreen()
        .then(() => {
          isFullscreenMode = true;
          updateScale();
        })
        .catch(console.error);
    }
    return;
  }
  if (isFullscreen()) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      if (currentSlideIndex < slidesData.length - 1) {
        displaySlide(currentSlideIndex + 1);
      }
      if (currentSlideIndex === slidesData.length - 1) {
        showToast("Đã là trang cuối cùng");
      }
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      if (currentSlideIndex > 0) {
        displaySlide(currentSlideIndex - 1);
      }
      if (currentSlideIndex === 0) {
        showToast("Đã là trang đầu tiên");
      }
    }
  }
});

// Toast
function showToast(message, duration = 2000) {
  const toast = document.createElement("div");
  toast.classList.add("toast");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", "0 0 512 512");
  svg.setAttribute("width", "13px");
  svg.setAttribute("height", "13px");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "#63E6BE");
  path.setAttribute(
    "d",
    "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
  );

  svg.appendChild(path);
  toast.appendChild(svg);

  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);

  slideViewer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide"); // Thêm class để animate ra ngoài
    setTimeout(() => {
      toast.remove(); // Xóa sau khi hoàn tất animation ra
    }, 500); // thời gian trùng với duration của animation
  }, 2000); // thời gian hiển thị toast
}

// Hàm tạo thumbnail cho từng slide
function generateSlideThumbnails() {
  slideListContainer.innerHTML = "";

  slidesData.forEach((slide, index) => {
    const thumbnail = document.createElement("div");
    thumbnail.className = `slide-thumbnail ${index === 0 ? "active" : ""}`;

    // Tách riêng số thứ tự
    thumbnail.innerHTML = `
      <div class="thumbnail-number">${index + 1}</div>
      <div class="thumbnail-content"></div>
    `;

    const content = thumbnail.querySelector(".thumbnail-content");

    // Đặt kích thước chuẩn
    content.style.transform = "scale(0.1)";
    content.style.transformOrigin = "0 0";
    content.style.width = "990px";
    content.style.height = "555px";

    // Thêm background
    if (slide.background?.type === "solid") {
      content.style.backgroundColor = slide.background.color;
    }

    // Thêm các element
    slide.elements?.forEach((elementData) => {
      const element = createElement(elementData, true);
      content.appendChild(element);
    });

    thumbnail.addEventListener("click", () => displaySlide(index));
    slideListContainer.appendChild(thumbnail);
  });
}

// Khởi tạo
function initialize(data) {
  // Xác định cấu trúc dữ liệu
  if (Array.isArray(data)) {
    slidesData = data;
  } else {
    showError("Dữ liệu không hợp lệ: File JSON phải chứa một mảng các slide");
    return;
  }

  // Kiểm tra dữ liệu
  if (slidesData.length === 0) {
    showError("File JSON không chứa slide nào");
    return;
  }

  // Hiển thị giao diện
  slidesContainer.style.display = "flex";
  noFileMessage.style.display = "none";
  jsonErrorDisplay.style.display = "none";
  fullscreenBtn.style.display = "inline-block";

  // Cập nhật thông tin
  totalSlidesSpan.textContent = slidesData.length;
  currentSlideIndex = 0;

  generateSlideThumbnails();

  // Hiển thị slide đầu tiên
  displaySlide(currentSlideIndex);
}

let editMode = false;
let currentEditingCell = null;

// Bắt sự kiện double click trên bảng
document.addEventListener("dblclick", (e) => {
  const tableElement = e.target.closest(".element-table");
  if (tableElement && !isFullscreen()) {
    // Vào chế độ chỉnh sửa
    editMode = true;
    tableElement.style.cursor = "text";

    // Ngăn kéo bảng khi đang chỉnh sửa
    tableElement.removeEventListener("mousedown", startDrag);
  }
});

// Bắt sự kiện click để chỉnh sửa ô cụ thể
document.addEventListener("click", (e) => {
  if (!editMode) return;

  const cellDiv = e.target.closest(".table-cell-content");

  // Nếu click vào ô
  if (cellDiv) {
    // Kết thúc chỉnh sửa ô cũ (nếu có)
    if (currentEditingCell && currentEditingCell !== cellDiv) {
      currentEditingCell.contentEditable = "false";
      currentEditingCell.blur();
    }

    currentEditingCell = cellDiv;
    cellDiv.contentEditable = "true";
    cellDiv.focus();

    // Ngăn kéo bảng khi đang chỉnh sửa
    const table = e.target.closest(".element-table");
    if (table) {
      table.removeEventListener("mousedown", startDrag);
    }
  } else {
    // Nếu click ra ngoài, thoát chế độ chỉnh sửa
    if (currentEditingCell) {
      currentEditingCell.contentEditable = "false";
      currentEditingCell.blur();
      currentEditingCell = null;
    }

    // Thoát chế độ chỉnh sửa
    editMode = false;

    document.querySelectorAll(".element-table").forEach((table) => {
      table.style.cursor = "move";
      table.addEventListener("mousedown", startDrag);
    });
  }
});
