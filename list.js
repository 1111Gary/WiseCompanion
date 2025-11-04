<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>签到/小任务 - 慧伴管家</title>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="manifest" href="manifest.json">
    
    <!-- 使用 Bootstrap 和 Font Awesome -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    
    <!-- 引入 list.js，它包含所有数据加载和渲染逻辑 -->
    <script src="list.js"></script>    
    
    <style>
        /* 保持深色背景和卡片样式与 index.html 一致 */
        body { 
            background-color: #0f172a; 
            color: #f8f9fa; 
            padding-bottom: 20px;
        }
        .header-bar { 
            background-color: #1e293b; 
            color: #f8f9fa; 
            padding-top: calc(10px + env(safe-area-inset-top)); 
            padding-bottom: 10px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .activity-card { 
            display: flex; 
            align-items: center; 
            padding: 15px; 
            border-radius: 12px; 
            background-color: #1e293b; 
            color: #f8f9fa; 
            text-decoration: none; 
            border: 1px solid #334155;
            transition: transform 0.2s; 
        }
        .activity-card:hover { text-decoration: none; color: #f8f9fa; }
        .activity-icon-container { 
            width: 45px; 
            height: 45px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            border-radius: 10px; 
            font-size: 24px;
            margin-right: 15px; 
        }
        .bg-info { 
            background: linear-gradient(45deg, #0d6efd, #00bfff); 
            color: #fff; 
        }
        .activity-content { flex-grow: 1; }
        .activity-title { font-weight: 600; font-size: 1.1rem; }
        .activity-desc { font-size: 0.8rem; color: #94a3b8; }
        
        .d-flex { display: flex; }
        .me-2 { margin-right: 0.5rem; }
        .mb-3 { margin-bottom: 1rem; }
    </style>
</head>
<body> <!-- 移除了 onload 属性 -->

<div class="header-bar">
    <div class="container d-flex align-items-center">
        <!-- 返回 index.html -->
        <a href="index.html" class="text-white me-3" style="font-size: 1.2rem;"><i class="fas fa-chevron-left"></i></a>
        <!-- 页面标题可以直接硬编码或在 list.js 中处理 -->
        <h5 id="page-title" class="m-0 text-white flex-grow-1">✨ 签到/小任务总览</h5>
    </div>
</div>

<main class="container py-3">
    <div id="activity-list" class="space-y-3">
        <!-- 初始加载状态提示 -->
        <div class="p-4 text-center text-gray">数据加载中，请稍候...</div>
    </div>
</main>

<script>
    // ----------------------------------------------------
    // ** 强制设置 URL Hash **
    // ----------------------------------------------------
    // 确保页面加载时 URL Hash 始终是 'CheckIn'，这会触发 list.js 中的正确过滤逻辑。
    if (window.location.hash !== '#CheckIn') {
        window.location.hash = 'CheckIn';
    }
</script>

<!-- 额外的 JavaScript 库（如果需要） -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>
