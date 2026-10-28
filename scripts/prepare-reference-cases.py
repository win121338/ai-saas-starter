"""Deterministic second intake. No AI editing; original files are never overwritten.

Run with the bundled Pillow Python: prepare-reference-cases.py export|verify
The original case1–3 intake and its scripts remain unchanged.
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/case-templates'
REVIEW = CONTENT / '_review/2026-10-27-references'
GROUPS = [
    dict(folder='case1', id='indie-ink-portrait', name=['把自己画进独立漫画', 'Indie Ink Portrait'],
         summary=['粗墨线与黑白留白，把熟悉的神态重画成独立漫画角色。', 'Bold ink and quiet white space turn familiar expressions into indie comic characters.'],
         suitability=['适合脸部与发型清晰的单人头像、半身照；保留原有表情和识别特征。多人及复杂遮挡待实测。', 'Best for a clear single-person portrait or upper-body photo. Groups and heavy occlusion remain untested.'],
         tags=['comic','portrait','ink','black-and-white'], ref=[0,848,1206,677],
         photos=[(350,856),(388,823),(321,888),(347,859),(341,864),(388,822)],
         titles=[['耳机里的片刻','Headphone Pause'],['托腮放空','Quiet Thoughts'],['运动服与墨线','Sportswear in Ink'],['抬手之间','An Upward Gesture'],['狗狗帽小情绪','Dog Hat Mood'],['橙帽侧影','Orange Hat Portrait']],
         cover='001', reason='耳机、发型与手势清楚，黑白墨块在缩略图中也有辨识度。'),
    dict(folder='case2', id='retro-grain-poster', name=['把生活印成复古海报','Retro Grain Poster'],
         summary=['高饱和色面、纸张颗粒与套印偏移，让日常照片带上复古印刷质感。','Rich color, paper grain and offset ink give everyday photos a vintage print finish.'],
         suitability=['适合人物清晰、姿态明确的单人日常照。保留照片骨架与真实神态，强调色彩和印刷质感；低清与极暗照片待验证。','Use a clear single-person photo with a readable pose. The recipe keeps the photographic structure while changing color and print texture.'],
         tags=['poster','portrait','retro','print'], ref=[0,785,1206,804],
         photos=[(280,897),(272,897),(196,1015),(272,897),(309,897)],
         titles=[['街角的蓝与粉','Blue and Pink Afternoon'],['黄色上衣的午后','Yellow Shirt Afternoon'],['红黄棒球衫','Red and Yellow Jersey'],['咖啡馆里的托腮','Cafe Daydream'],['慢饮一口','A Slow Sip']],
         cover='001', reason='蓝粉背景与黑衣人物对比强，印刷颗粒和姿态在小图中容易识别。'),
    dict(folder='case3', id='cool-blue-glitch', name=['掉进冷蓝漫画频道','Cool Blue Comic Signal'],
         summary=['冷蓝色块与珊瑚暖色交错，重绘带有错版与信号失真的动漫场景。','Cool blue planes and warm coral accents redraw daily scenes with comic print misregistration.'],
         suitability=['适合主体、动作和场景关系清楚的人像照片。会明显重绘形体和环境，不承诺摄影级相似；极复杂多人场景待验证。','Choose a readable portrait, pose and setting. This recipe deliberately redraws shapes and scenery; photographic likeness is not promised.'],
         tags=['comic','portrait','blue','glitch'], ref=[0,288,1206,1797],
         photos=[(413,794),(402,804),(400,806),(413,793),(401,804),(377,829)],
         titles=[['长椅上的冷蓝午后','Blue Afternoon on the Bench'],['蓝裙与树影','Blue Dress and Tree Shade'],['晴空台阶','Steps Under Blue Skies'],['抬眼的瞬间','An Upward Glance'],['指间的目光','A Framed Glance'],['举杯入夜','An Evening Toast']],
         cover='001', reason='人物、长椅与场景层级明确，冷蓝与珊瑚色差能代表本组重绘方向。'),
]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')

def source_dir(group):
    public = ROOT/'public/cases'/group['folder']
    return public if public.is_dir() else CONTENT/'_intake/2026-10-27-references'/group['folder']

def preserve(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if digest(source) != digest(target):
            raise ValueError(f'Original changed; review before overwriting: {target}')
    else:
        shutil.copyfile(source, target)
    assert digest(source) == digest(target)

def crop(source, rect):
    x,y,w,h=rect
    assert min(x,y)>=0 and min(w,h)>0 and x+w<=source.width and y+h<=source.height
    return source.crop((x,y,x+w,y+h))

def contact(items, destination):
    columns=4; cw=310; ch=410
    sheet=Image.new('RGB',(columns*cw,((len(items)+columns-1)//columns)*ch),'#20242c')
    draw=ImageDraw.Draw(sheet); font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
    for i,(label,file) in enumerate(items):
        im=Image.open(file).convert('RGB'); im.thumbnail((cw-12,ch-34))
        x=i%columns*cw; y=i//columns*ch
        sheet.paste(im,(x+(cw-im.width)//2,y+28)); draw.text((x+8,y+7),label,fill='white',font=font)
    destination.parent.mkdir(parents=True,exist_ok=True); sheet.save(destination,quality=95,subsampling=0)

def export():
    REVIEW.mkdir(parents=True,exist_ok=True)
    for group in GROUPS:
        directory=CONTENT/group['id']; public=ROOT/'public/cases'/group['id']; source=source_dir(group)
        directory.mkdir(parents=True,exist_ok=True); public.mkdir(parents=True,exist_ok=True)
        preserve(source/'p.md',directory/'p.md'); preserve(source/'refer.png',directory/'references/refer.png')
        if (directory/'template.json').exists():
            print(group['id']+': existing manifest retained; run verify'); continue
        reference=crop(Image.open(source/'refer.png').convert('RGB'),group['ref'])
        temporary=directory/'references/reference.webp'; reference.save(temporary,lossless=True)
        reference_sha=digest(temporary); reference_file=directory/'references'/f'{reference_sha}.webp'
        if reference_file.exists(): temporary.unlink()
        else: temporary.rename(reference_file)
        ref={'src':f"/creative-references/{group['id']}/{reference_sha}.webp",'width':reference.width,'height':reference.height}
        cases=[]; overview=[]
        for index,(left,right) in enumerate(group['photos'],1):
            name=f'{index}.png'; number=f'{index:03}'; preserve(source/name,directory/'originals'/name)
            image=Image.open(source/name).convert('RGB')
            rects={'before':[left,383,right-left,402],'after':[0,785,1206,1206],'compare':[0,383,1206,1608]}
            assets={}; sizes={}; hashes={}
            for kind,rect in rects.items():
                output=public/f'{number}-{kind}.webp'; derived=crop(image,rect); derived.save(output,lossless=True)
                assets[kind]=f'/cases/{group["id"]}/{output.name}'; sizes[kind]=list(derived.size); hashes[kind]=digest(output)
                overview.append((f'{number}-{kind}',output))
            thumb=crop(image,rects['after']); thumb.thumbnail((640,640)); output=public/f'{number}-thumb.webp'; thumb.save(output,quality=90)
            assets['thumb']=f'/cases/{group["id"]}/{output.name}'; sizes['thumb']=list(thumb.size); hashes['thumb']=digest(output); overview.append((f'{number}-thumb',output))
            title=group['titles'][index-1]
            cases.append({'id':number,'title':title[0],'titleEn':title[1],'alt':{'zh':group['name'][0]+'：'+title[0],'en':group['name'][1]+': '+title[1]},'subjectTags':['portrait'],'sourceFile':f'originals/{name}','sourceSha256':digest(source/name),'sourceSize':list(image.size),'cropRects':rects,'assets':assets,'assetSizes':sizes,'assetSha256':hashes,'review':'pending','notes':'来源截图，非本站生成；原照为截图提取。'})
        recipe={'inputMode':'photo-with-reference','referenceImage':ref,'prompt':(directory/'p.md').read_text(encoding='utf8').strip(),'rule':'图一只提供风格，图二只提供用户人物身份、原有表情、姿态和场景锚点。仅生成最终作品，不拼接对比、不添加手机界面。禁止复制参考图的人物、香烟、文字、商标、水印、署名或无关道具。保持用户照片主体数量，不凭空增加人物和肢体。','aspectRatio':'1:1','modelIds':['qwen-image-2.1-turbo','qwen-image-3.0-pro','wan2.7-image-pro','wan2.7-image','doubao-seedream-5-0-flash-260915'],'defaultModel':'qwen-image-2.1-turbo','fields':[],'tested':False,'testReport':''}
        # Original manuscripts are preserved; image roles are made explicit in the prepared recipe.
        if group['folder']=='case1': recipe['prompt']=recipe['prompt'].replace('参考图漫画人物图的气质','参考图一漫画人物图的气质')
        if group['folder']=='case3': recipe['prompt']=recipe['prompt'].replace('风格参考','图一风格参考').replace('真实照片','图二真实照片')
        write_json(directory/'generation-v1.json',recipe)
        manifest={'schemaVersion':1,'id':group['id'],'name':dict(zip(['zh','en'],group['name'])),'summary':dict(zip(['zh','en'],group['summary'])),'tags':group['tags'],'subjectTags':['portrait'],'status':'prepared','generationReady':False,'promotion':'candidate','provenance':'collected-reference','source':{'platform':'douyin','url':None,'author':None},'displayPermission':'pending','processingDate':'2026-10-27','intakeBatch':'2026-10-27-references','sourceFolder':group['folder'],'coverCaseId':group['cover'],'comparisonCaseId':group['cover'],'featuredCaseIds':['001','002','003'],'coverReason':group['reason'],'coverAlternatives':[{'caseId':'002','reason':'补充人物与神态场景。'},{'caseId':'003','reason':'补充服装与姿态变化。'}],'prompt':{'original':'p.md','prepared':'prompt-v1.md','version':1,'referenceRequired':True,'referenceFiles':['references/refer.png',f'references/{reference_sha}.webp']},'reference':{'sourceSha256':digest(source/'refer.png'),'sourceSize':[1206,2622],'cropRect':group['ref'],'image':ref,'sha256':reference_sha},'generation':{'tested':False,'model':None,'publishedStyleSlug':None,'publishedPromptVersion':None,'testReport':None},'evaluation':{'visualAppeal':None,'useMotivation':None,'stability':None,'subjectCoverage':None,'costAndEffort':None,'totalScore':None},'cases':cases}
        write_json(directory/'template.json',manifest)
        package={'schemaVersion':1,'id':group['id'],'name':manifest['name'],'summary':manifest['summary'],'suitability':dict(zip(['zh','en'],group['suitability'])),'tags':group['tags'],'coverCaseId':group['cover'],'featuredCaseIds':manifest['featuredCaseIds'],'recipe':recipe,'cases':[{'id':c['id'],'title':{'zh':c['title'],'en':c['titleEn']},'alt':c['alt'],'before':{'src':c['assets']['before'],'width':c['assetSizes']['before'][0],'height':c['assetSizes']['before'][1]},'after':{'src':c['assets']['after'],'width':1206,'height':1206},'thumbnail':{'src':c['assets']['thumb'],'width':640,'height':640},'tags':group['tags'],'provenance':'collected-reference'} for c in cases]}
        write_json(directory/'creative-template.json',package)
        (directory/'prompt-v1.md').write_text('# 项目版配方 v1\n\n输入顺序：图一是风格参考图，图二是用户完整照片。\n\n'+recipe['prompt']+'\n\n'+recipe['rule']+'\n\n尚未运行真实模型质量实测。\n',encoding='utf8')
        contact(overview,REVIEW/f'{group["id"]}-exports.jpg')
        print(group['id']+f': {len(cases)} cases and one reference prepared')

def verify():
    count=0
    for group in GROUPS:
        directory=CONTENT/group['id']; manifest=json.loads((directory/'template.json').read_text(encoding='utf8')); source=source_dir(group)
        assert digest(directory/'p.md')==digest(source/'p.md')
        reference=manifest['reference']; assert digest(directory/'references/refer.png')==reference['sourceSha256']==digest(source/'refer.png')
        derived=directory/'references'/f'{reference["sha256"]}.webp'; assert digest(derived)==reference['sha256']
        assert not ImageChops.difference(crop(Image.open(source/'refer.png').convert('RGB'),reference['cropRect']),Image.open(derived).convert('RGB')).getbbox()
        for case in manifest['cases']:
            original=directory/case['sourceFile']; assert digest(original)==case['sourceSha256']==digest(source/original.name)
            image=Image.open(original).convert('RGB')
            for kind,asset in case['assets'].items():
                target=ROOT/'public'/asset.lstrip('/'); assert digest(target)==case['assetSha256'][kind]
                saved=Image.open(target).convert('RGB'); assert list(saved.size)==case['assetSizes'][kind]
                if kind!='thumb': assert not ImageChops.difference(crop(image,case['cropRects'][kind]),saved).getbbox()
                count+=1
        print(group['id']+': source hashes, reference and all lossless crops verified')
    print(f'{count} case derivatives + 3 references verified')

if __name__=='__main__':
    {'export':export,'verify':verify}[sys.argv[1]]()
